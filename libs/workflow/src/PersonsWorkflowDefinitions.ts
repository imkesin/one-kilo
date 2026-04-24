import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as Workflow from "@effect/workflow/Workflow"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import * as Schema from "effect/Schema"

export const SyncPersonToWorkOS = Workflow.make({
  name: "@one-kilo/workflow/SyncPersonToWorkOS",
  payload: {
    personId: PersonId,
    workosUserId: WorkOSIds.UserId,
    firstName: Schema.String,
    lastName: Schema.String
  },
  idempotencyKey: ({ personId }) => personId
})
