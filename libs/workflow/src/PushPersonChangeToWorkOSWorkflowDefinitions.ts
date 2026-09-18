import * as Workflow from "@effect/workflow/Workflow"
import { AuditLogId } from "@one-kilo/domain/ids/AuditLogId"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"

const ID_PREFIX = "@one-kilo/workflow/PushPersonChangeToWorkOSWorkflow"

export class PushPersonChangeToWorkOSSuccess extends S.TaggedClass<PushPersonChangeToWorkOSSuccess>(
  `${ID_PREFIX}/Success`
)(
  "PushPersonChangeToWorkOSSuccess",
  {
    outcome: S.Literal(
      "AccountUnlinked",
      "AlreadySynced",
      "DriftDetected",
      "Updated"
    )
  }
) {}

export class PushPersonChangeToWorkOSError extends S.TaggedError<PushPersonChangeToWorkOSError>(
  `${ID_PREFIX}/Error`
)(
  "PushPersonChangeToWorkOSError",
  {
    reason: S.Literal(
      "RetryExhausted",
      "Unexpected"
    ),
    cause: S.Defect
  }
) {}

export const PushPersonChangeToWorkOSWorkflow = Workflow.make({
  name: "@one-kilo/workflow/PushPersonChangeToWorkOSWorkflow",
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
    personId: pipe(
      PersonId,
      S.annotations({
        description:
          "The person whose change is being pushed. The linked account's WorkOS user is resolved at run time, not at enqueue time."
      })
    )
  },
  success: PushPersonChangeToWorkOSSuccess,
  error: PushPersonChangeToWorkOSError,
  idempotencyKey: ({ causedByAuditLogId }) => causedByAuditLogId
})
  .annotate(Workflow.SuspendOnFailure, true)
