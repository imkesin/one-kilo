import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as Workflow from "@effect/workflow/Workflow"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"

export const PushWorkOSUserChange = Workflow.make({
  name: "@one-kilo/workflow/PushWorkOSUserChange",
  payload: {
    workosUserId: WorkOSIds.UserId,
    expected: pipe(
      S.Struct({
        firstName: S.String,
        lastName: S.String
      }),
      S.annotations({
        description: "The expected state of the WorkOS user before applying changes."
      })
    )
  },
  idempotencyKey: ({ workosUserId }) => workosUserId
})
