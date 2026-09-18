import * as WorkOSApiGateway from "@effect/auth-workos/ApiGateway"
import * as WorkOSError from "@effect/auth-workos/domain/Errors"
import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as S from "effect/Schema"
import { PersonsQueryModule } from "../modules/persons/PersonsQueryModule.ts"
import * as ActivityExtensions from "./ActivityExtensions.ts"

const ID_PREFIX = "@one-kilo/core/UpdateWorkOSUserActivity"

type UpdateWorkOSUserActivityParameters = {
  readonly personId: PersonId
  readonly expected: {
    firstName: string
    lastName: string | null
  }
}

class AlreadySyncedOutcome extends S.TaggedClass<AlreadySyncedOutcome>(
  `${ID_PREFIX}/AlreadySyncedOutcome`
)(
  "AlreadySyncedOutcome",
  {}
) {}

class UpdatedOutcome extends S.TaggedClass<UpdatedOutcome>(
  `${ID_PREFIX}/UpdatedOutcome`
)(
  "UpdatedOutcome",
  {}
) {}

const UpdateWorkOSUserActivityOutcome = S.Union(
  AlreadySyncedOutcome,
  UpdatedOutcome
)

class TargetedPersonNotFoundError extends S.TaggedError<TargetedPersonNotFoundError>(
  `${ID_PREFIX}/TargetedPersonNotFoundError`
)(
  "TargetedPersonNotFoundError",
  {
    personId: PersonId
  }
) {
  readonly isRetryable = false
}

class AccountNotLinkedError extends S.TaggedError<AccountNotLinkedError>(
  `${ID_PREFIX}/AccountNotLinkedError`
)(
  "AccountNotLinkedError",
  {
    personId: PersonId
  },
  {
    description: "The targeted person has no linked account, so there is no WorkOS user to update."
  }
) {
  readonly isRetryable = false
}

class WorkOSOperationError extends S.TaggedError<WorkOSOperationError>(
  `${ID_PREFIX}/WorkOSOperationError`
)(
  "WorkOSOperationError",
  {
    operation: S.Literal("RetrieveUser", "UpdateUser"),
    cause: WorkOSError.WorkOSCommonError
  }
) {
  get isRetryable() {
    return this.cause.isTransient
  }
}

class WorkOSUserNotFoundError extends S.TaggedError<WorkOSUserNotFoundError>(
  `${ID_PREFIX}/WorkOSUserNotFoundError`
)(
  "WorkOSUserNotFoundError",
  {
    cause: S.Defect,
    workosUserId: WorkOSIds.UserId
  }
) {
  readonly isRetryable = false
}

class WorkOSUserStateDriftError extends S.TaggedError<WorkOSUserStateDriftError>(
  `${ID_PREFIX}/WorkOSUserStateDriftError`
)(
  "WorkOSUserStateDriftError",
  {
    actual: S.Struct({
      firstName: pipe(
        S.NonEmptyTrimmedString,
        S.NullOr
      ),
      lastName: pipe(
        S.NonEmptyTrimmedString,
        S.NullOr
      )
    }),
    expected: S.Struct({
      firstName: S.NonEmptyTrimmedString,
      lastName: pipe(
        S.NonEmptyTrimmedString,
        S.NullOr
      )
    })
  }
) {
  readonly isRetryable = false
}

const UpdateWorkOSUserActivityError = S.Union(
  AccountNotLinkedError,
  TargetedPersonNotFoundError,
  WorkOSOperationError,
  WorkOSUserNotFoundError,
  WorkOSUserStateDriftError
)

export const updateWorkOSUserActivity = (parameters: UpdateWorkOSUserActivityParameters) =>
  ActivityExtensions.makeWithDurableRetry({
    name: "@one-kilo/activity/UpdateWorkOSUser",
    success: UpdateWorkOSUserActivityOutcome,
    error: UpdateWorkOSUserActivityError,
    while: (e) => e.isRetryable,
    execute: Effect.gen(function*() {
      const workosGatewayClient = yield* WorkOSApiGateway.ApiGateway
      const personsQueryModule = yield* PersonsQueryModule

      /*
       * The WorkOS user is resolved at run time rather than carried in the payload, so an account
       * unlinked between enqueue and run aborts instead of updating a stale WorkOS user.
       */
      const { person, maybeAccount } = yield* pipe(
        personsQueryModule.retrievePersonEntityWithAccount({ personId: parameters.personId }),
        Effect.flatMap(
          Option.match({
            onSome: Effect.succeed,
            onNone: () => TargetedPersonNotFoundError.make({ personId: parameters.personId })
          })
        )
      )

      if (Option.isNone(maybeAccount)) {
        return yield* AccountNotLinkedError.make({ personId: parameters.personId })
      }

      const { workosUserId } = maybeAccount.value

      const workosUser = yield* pipe(
        workosGatewayClient.userManagement.retrieveUser(workosUserId),
        Effect.catchTags({
          "ResourceNotFoundError": (e) =>
            WorkOSUserNotFoundError.make({
              cause: e,
              workosUserId
            }),
          "WorkOSCommonError": (e) =>
            WorkOSOperationError.make({
              cause: e,
              operation: "RetrieveUser"
            })
        })
      )

      const derivedWorkOSName = yield* pipe(
        person.deriveWorkOSName(),
        orDieWithUnexpectedError("Failed to derive a WorkOS name from the person")
      )

      if (
        derivedWorkOSName.firstName === workosUser.firstName
        && derivedWorkOSName.lastName === workosUser.lastName
      ) {
        return AlreadySyncedOutcome.make()
      }

      if (
        parameters.expected.firstName !== workosUser.firstName
        || parameters.expected.lastName !== workosUser.lastName
      ) {
        return yield* WorkOSUserStateDriftError.make({
          actual: {
            firstName: workosUser.firstName,
            lastName: workosUser.lastName
          },
          expected: parameters.expected
        })
      }

      yield* pipe(
        workosGatewayClient.userManagement.updateUser(
          workosUserId,
          {
            firstName: derivedWorkOSName.firstName,
            lastName: derivedWorkOSName.lastName
          }
        ),
        Effect.catchTags({
          "ResourceNotFoundError": (e) =>
            WorkOSUserNotFoundError.make({
              cause: e,
              workosUserId
            }),
          "WorkOSCommonError": (e) =>
            WorkOSOperationError.make({
              cause: e,
              operation: "UpdateUser"
            })
        })
      )

      return UpdatedOutcome.make()
    })
  })
