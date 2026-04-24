import * as WorkOSActivities from "@one-kilo/core/activities/WorkOSActivities"
import * as PersonsWorkflows from "@one-kilo/workflow/PersonsWorkflowDefinitions"
import * as Effect from "effect/Effect"

export const SyncPersonToWorkOSLive = PersonsWorkflows.SyncPersonToWorkOS.toLayer(
  Effect.fn("SyncPersonToWorkOS.execute")(function*(payload) {
    yield* WorkOSActivities.updateWorkOSUser({
      workosUserId: payload.workosUserId,
      firstName: payload.firstName,
      lastName: payload.lastName
    })
  })
)
