import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as Workflow from "@effect/workflow/Workflow"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"

export class PushWorkOSUserChangeSuccess extends S.TaggedClass<PushWorkOSUserChangeSuccess>(
  "@one-kilo/workflow/PushWorkOSUserChange/Success"
)(
  "PushWorkOSUserChangeSuccess",
  {
    outcome: S.Literal(
      "AlreadySynced",
      "DriftDetected",
      "Updated"
    )
  }
) {}

export class PushWorkOSUserChangeError extends S.TaggedError<PushWorkOSUserChangeError>(
  "@one-kilo/workflow/PushWorkOSUserChange/Error"
)(
  "PushWorkOSUserChangeError",
  {
    reason: S.Literal(
      "RetryExhausted",
      "Unexpected"
    ),
    cause: S.Defect
  }
) {}

export const PushWorkOSUserChange = Workflow.make({
  name: "@one-kilo/workflow/PushWorkOSUserChange",
  payload: {
    workosUserId: WorkOSIds.UserId,
    expected: pipe(
      S.Struct({
        firstName: S.NonEmptyTrimmedString,
        lastName: S.NonEmptyTrimmedString
      }),
      S.annotations({
        description: "The expected state of the WorkOS user before applying changes."
      })
    )
  },
  success: PushWorkOSUserChangeSuccess,
  error: PushWorkOSUserChangeError,
  idempotencyKey: ({ workosUserId }) => workosUserId
})
  .annotate(Workflow.SuspendOnFailure, true)
