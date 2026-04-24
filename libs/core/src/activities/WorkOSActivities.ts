import * as WorkOSApiGateway from "@effect/auth-workos/ApiGateway"
import type * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as Activity from "@effect/workflow/Activity"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"

type UpdateWorkOSUserPayload = {
  readonly workosUserId: WorkOSIds.UserId
  readonly firstName: string
  readonly lastName: string
}

export const updateWorkOSUser = (payload: UpdateWorkOSUserPayload) =>
  Activity.make({
    name: "WorkOSActivities.updateWorkOSUser",
    execute: Effect.gen(function*() {
      const workos = yield* WorkOSApiGateway.ApiGateway

      yield* pipe(
        workos.userManagement.updateUser(
          payload.workosUserId,
          {
            firstName: payload.firstName,
            lastName: payload.lastName
          }
        ),
        orDieWithUnexpectedError("Failed to update WorkOS user")
      )
    })
  })
