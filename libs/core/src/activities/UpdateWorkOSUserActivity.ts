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

const UpdateWorkOSUserActivityError = S.Union(
  TargetedUserNotFoundError,
  WorkOSUserNotFoundError
)

export const updateWorkOSUserActivity = (parameters: UpdateWorkOSUserActivityParameters) =>
  ActivityExtensions.makeWithDurableRetry({
    name: "@one-kilo/activity/UpdateWorkOSUser",
    error: UpdateWorkOSUserActivityError,
    execute: Effect.gen(function*() {
      const workosGatewayClient = yield* WorkOSApiGateway.ApiGateway
      const usersQueryModule = yield* UsersQueryModule

      const [_user, _workosUser] = yield* Effect.all(
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

      // If it doesn't match expectations, also fail
      // If change isn't needed, that's an early success

      yield* pipe(
        workosGatewayClient.userManagement.updateUser(
          parameters.workosUserId,
          {
            firstName: "FIX ME",
            lastName: "FIX ME"
          }
        ),
        // This failure needs to be retryable
        orDieWithUnexpectedError("Failed to update WorkOS user")
      )

      // If we got here, succeed clearly
    })
  })
