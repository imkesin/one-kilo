import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as Workflow from "@effect/workflow/Workflow"

export const SyncUserToWorkOS = Workflow.make({
  name: "@one-kilo/workflow/SyncUserToWorkOS",
  payload: {
    workosUserId: WorkOSIds.UserId
  },
  idempotencyKey: ({ workosUserId }) => workosUserId
})
