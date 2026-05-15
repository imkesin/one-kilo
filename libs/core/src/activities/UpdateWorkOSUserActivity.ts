import * as WorkOSApiGateway from "@effect/auth-workos/ApiGateway"
import * as WorkOSError from "@effect/auth-workos/domain/Errors"
import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as S from "effect/Schema"
import { UsersQueryModule } from "../modules/users/UsersQueryModule.ts"
import * as ActivityExtensions from "./ActivityExtensions.ts"

type UpdateWorkOSUserActivityParameters = {
  readonly workosUserId: WorkOSIds.UserId
  readonly expected: {
    firstName: string
    lastName: string
  }
}

class AlreadySyncedOutcome extends S.TaggedClass<AlreadySyncedOutcome>()(
  "UpdateWorkOSUserActivity/AlreadySyncedOutcome",
  {}
) {}

class UpdatedOutcome extends S.TaggedClass<UpdatedOutcome>()(
  "UpdateWorkOSUserActivity/UpdatedOutcome",
  {}
) {}

const UpdateWorkOSUserActivityOutcome = S.Union(
  AlreadySyncedOutcome,
  UpdatedOutcome
)

class TargetedUserNotFoundError extends S.TaggedError<TargetedUserNotFoundError>()(
  "UpdateWorkOSUserActivity/TargetedUserNotFoundError",
  {
    workosUserId: WorkOSIds.UserId
  }
) {
  readonly isRetryable = false
}

class WorkOSOperationError extends S.TaggedError<WorkOSOperationError>()(
  "UpdateWorkOSUserActivity/WorkOSOperationError",
  {
    operation: S.Literal("RetrieveUser", "UpdateUser"),
    cause: WorkOSError.WorkOSCommonError
  }
) {
  get isRetryable() {
    return this.cause.isTransient
  }
}

class WorkOSUserNotFoundError extends S.TaggedError<WorkOSUserNotFoundError>()(
  "UpdateWorkOSUserActivity/WorkOSUserNotFoundError",
  {
    cause: S.Defect,
    workosUserId: WorkOSIds.UserId
  }
) {
  readonly isRetryable = false
}

class WorkOSUserStateDriftError extends S.TaggedError<WorkOSUserStateDriftError>()(
  "UpdateWorkOSUserActivity/WorkOSUserStateDriftError",
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
      lastName: S.NonEmptyTrimmedString
    })
  }
) {
  readonly isRetryable = false
}

const UpdateWorkOSUserActivityError = S.Union(
  TargetedUserNotFoundError,
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
      const usersQueryModule = yield* UsersQueryModule

      const [user, workosUser] = yield* Effect.all(
        [
          pipe(
            usersQueryModule.retrieveUserByWorkOSUserId({ workosUserId: parameters.workosUserId }),
            Effect.andThen(
              Option.match({
                onSome: Effect.succeed,
                onNone: () => TargetedUserNotFoundError.make({ workosUserId: parameters.workosUserId })
              })
            )
          ),
          pipe(
            workosGatewayClient.userManagement.retrieveUser(parameters.workosUserId),
            Effect.catchTags({
              "ResourceNotFoundError": (e) =>
                WorkOSUserNotFoundError.make({
                  cause: e,
                  workosUserId: parameters.workosUserId
                }),
              "WorkOSCommonError": (e) =>
                WorkOSOperationError.make({
                  cause: e,
                  operation: "RetrieveUser"
                })
            })
          )
        ],
        { concurrency: "unbounded" }
      )

      const derivedWorkOSName = yield* pipe(
        user.person.deriveWorkOSName(),
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
          parameters.workosUserId,
          {
            firstName: derivedWorkOSName.firstName,
            lastName: derivedWorkOSName.lastName
          }
        ),
        Effect.catchTags({
          "ResourceNotFoundError": (e) =>
            WorkOSUserNotFoundError.make({
              cause: e,
              workosUserId: parameters.workosUserId
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
