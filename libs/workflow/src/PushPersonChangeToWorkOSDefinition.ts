import * as W from "@effect/workflow/Workflow"
import { AuditLogId } from "@one-kilo/domain/ids/AuditLogId"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"

const TAG_NAME = "PushPersonChangeToWorkOS"
const NAME = `@one-kilo/workflow/${TAG_NAME}`

export class WorkflowSuccess extends S.TaggedClass<WorkflowSuccess>(`${NAME}:Success`)(
  `${TAG_NAME}:Success`,
  {
    outcome: S.Literal(
      "AccountUnlinked",
      "AlreadySynced",
      "DriftDetected",
      "Updated"
    )
  }
) {}

export class WorkflowError extends S.TaggedError<WorkflowError>(`${NAME}:Error`)(
  `${TAG_NAME}:Error`,
  {
    reason: S.Literal(
      "RetryExhausted",
      "Unexpected"
    ),
    cause: S.Defect
  }
) {}

export const Workflow = W.make({
  name: NAME,
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
  success: WorkflowSuccess,
  error: WorkflowError,
  idempotencyKey: ({ causedByAuditLogId }) => causedByAuditLogId
})
  .annotate(W.SuspendOnFailure, true)
