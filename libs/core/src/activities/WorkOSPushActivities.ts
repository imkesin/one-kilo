import * as WorkOSApiGateway from "@effect/auth-workos/ApiGateway"
import type * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import { UsersQueryModule } from "../modules/users/UsersQueryModule.ts"
import * as ActivityExtensions from "./ActivityExtensions.ts"

type UpdateWorkOSUserActivityParameters = {
  readonly workosUserId: WorkOSIds.UserId
  readonly expected: {
    firstName: string
    lastName: string
  }
}

export const updateWorkOSUserActivity = (parameters: UpdateWorkOSUserActivityParameters) =>
  ActivityExtensions.makeWithDurableRetry({
    name: "WorkOSPushActivities.updateWorkOSUser",
    execute: Effect.gen(function*() {
      const workosGatewayClient = yield* WorkOSApiGateway.ApiGateway

      const usersQueryModule = yield* UsersQueryModule

      const _user = yield* usersQueryModule.retrieveUserByWorkOSUserId({ workosUserId: parameters.workosUserId })
      // We need to fail if doesn't exist

      // Now load from WorkOS and compare
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
