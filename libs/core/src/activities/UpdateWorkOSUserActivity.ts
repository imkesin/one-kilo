import * as WorkOSApiGateway from "@effect/auth-workos/ApiGateway"
import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { dieWithUnexpectedErrorCallback, orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
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
  WorkOSUserNotFoundError,
  WorkOSUserStateDriftError
)

export const updateWorkOSUserActivity = (parameters: UpdateWorkOSUserActivityParameters) =>
  ActivityExtensions.makeWithDurableRetry({
    name: "@one-kilo/activity/UpdateWorkOSUser",
    success: UpdateWorkOSUserActivityOutcome,
    error: UpdateWorkOSUserActivityError,
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
              "WorkOSCommonError": dieWithUnexpectedErrorCallback("The WorkOS user could not be retrieved")
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
        // This failure needs to be retryable
        orDieWithUnexpectedError("Failed to update WorkOS user")
      )

      return UpdatedOutcome.make()
    })
  })
