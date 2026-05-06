import * as WorkOSSyncActivities from "@one-kilo/core/activities/WorkOSSyncActivities"
import * as WorkOSSyncWorkflows from "@one-kilo/workflow/WorkOSSyncWorkflows"
import * as Effect from "effect/Effect"

export const SyncUserToWorkOSLive = WorkOSSyncWorkflows.SyncUserToWorkOS.toLayer(
  Effect.fn("SyncUserToWorkOSLive.execute")(function*(payload) {
    yield* WorkOSSyncActivities.updateWorkOSUser({
      workosUserId: payload.workosUserId,
      expected: payload.expected
    })
  })
)
