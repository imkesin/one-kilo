import { AuditLogId } from "@one-kilo/domain/ids/AuditLogId"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as W from "effect/workflow/Workflow"

const TAG_NAME = "PushPersonChangeToWorkOS"
const NAME = `@one-kilo/workflow/${TAG_NAME}`

export class WorkflowSuccess extends S.TaggedClass<WorkflowSuccess>(`${NAME}:Success`)(
  `${TAG_NAME}:Success`,
  {
    outcome: S.Literals([
      "AccountUnlinked",
      "AlreadySynced",
      "DriftDetected",
      "Updated"
    ])
  }
) {}

export class WorkflowError extends S.TaggedError<WorkflowError>(`${NAME}:Error`)(
  `${TAG_NAME}:Error`,
  {
    reason: S.Literals([
      "RetryExhausted",
      "Unexpected"
    ]),
    cause: S.Defect()
  }
) {}

export const Workflow = W.make(NAME, {
  payload: {
    causedByAuditLogId: pipe(
      AuditLogId,
      S.annotate({
        description:
          "The identifier of the `PersonUpdatedAuditLog` row this sync is reconciling. Used as the idempotency key — one workflow run per audit log."
      })
    ),
    expected: pipe(
      S.Struct({
        firstName: S.Trimmed.check(S.isNonEmpty()),
        lastName: pipe(
          S.Trimmed.check(S.isNonEmpty()),
          S.NullOr
        )
      }),
      S.annotate({
        description: "The expected state of the WorkOS user before applying changes."
      })
    ),
    personId: pipe(
      PersonId,
      S.annotate({
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
