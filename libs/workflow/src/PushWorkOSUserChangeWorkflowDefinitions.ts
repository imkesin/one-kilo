import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as Workflow from "@effect/workflow/Workflow"
import { AuditLogId } from "@one-kilo/domain/ids/AuditLogId"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"

const ID_PREFIX = "@one-kilo/workflow/PushWorkOSUserChangeWorkflow"

export class PushWorkOSUserChangeSuccess extends S.TaggedClass<PushWorkOSUserChangeSuccess>(
  `${ID_PREFIX}/Success`
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
  `${ID_PREFIX}/Error`
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

export const PushWorkOSUserChangeWorkflow = Workflow.make({
  name: "@one-kilo/workflow/PushWorkOSUserChangeWorkflow",
  payload: {
    causedByAuditLogId: pipe(
      AuditLogId,
      S.annotations({
        description:
          "The identifier of the `PersonUpdatedAuditLog` row this sync is reconciling. Used as the idempotency key — one workflow run per audit log."
      })
    ),
    expected: pipe(
      S.Struct({
        firstName: S.NonEmptyTrimmedString,
        lastName: pipe(
          S.NonEmptyTrimmedString,
          S.NullOr
        )
      }),
      S.annotations({
        description: "The expected state of the WorkOS user before applying changes."
      })
    ),
    workosUserId: WorkOSIds.UserId
  },
  success: PushWorkOSUserChangeSuccess,
  error: PushWorkOSUserChangeError,
  idempotencyKey: ({ causedByAuditLogId }) => causedByAuditLogId
})
  .annotate(Workflow.SuspendOnFailure, true)
