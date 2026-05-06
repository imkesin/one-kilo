import * as WorkOSApiGateway from "@effect/auth-workos/ApiGateway"
import type * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as ActivityExtensions from "./ActivityExtensions.ts"

type UpdateWorkOSUserPayload = {
  readonly workosUserId: WorkOSIds.UserId
  readonly expected: {
    firstName: string
    lastName: string
  }
}

export const updateWorkOSUser = (payload: UpdateWorkOSUserPayload) =>
  ActivityExtensions.makeWithDurableRetry({
    name: "WorkOSSyncActivities.updateWorkOSUser",
    execute: Effect.gen(function*() {
      const workos = yield* WorkOSApiGateway.ApiGateway

      yield* pipe(
        workos.userManagement.updateUser(
          payload.workosUserId,
          {
            firstName: "FIX ME",
            lastName: "FIX ME"
          }
        ),
        orDieWithUnexpectedError("Failed to update WorkOS user")
      )
    })
  })
