import * as WorkOSActivities from "@one-kilo/core/activities/WorkOSActivities"
import * as WorkOSSyncWorkflows from "@one-kilo/workflow/WorkOSSyncWorkflows"
import * as Effect from "effect/Effect"

export const SyncUserToWorkOSLive = WorkOSSyncWorkflows.SyncUserToWorkOS.toLayer(
  Effect.fn("SyncUserToWorkOSLive.execute")(function*(payload) {
    yield* WorkOSActivities.updateWorkOSUser({
      workosUserId: payload.workosUserId,
      firstName: "TODO",
      lastName: "TODO"
    })
  })
)
