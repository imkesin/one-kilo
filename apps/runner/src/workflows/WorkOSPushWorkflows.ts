import { updateWorkOSUserActivity } from "@one-kilo/core/activities/WorkOSPushActivities"
import { UsersQueryModule } from "@one-kilo/core/modules/users/UsersQueryModule"
import { PushWorkOSUserChange } from "@one-kilo/workflow/WorkOSPushWorkflows"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"

const execute = Effect.fn("PushWorkOSUserChange.execute")(
  function*(payload) {
    yield* updateWorkOSUserActivity({
      workosUserId: payload.workosUserId,
      expected: payload.expected
    })
  }
)

export const PushWorkOSUserChangeLive = pipe(
  execute,
  PushWorkOSUserChange.toLayer,
  Layer.provide(UsersQueryModule.Default)
)
