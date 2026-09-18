import type { PersonUpdatedAuditLog } from "@one-kilo/domain/audit-logs/PersonAuditLogs"
import type { PersonAccountEntity } from "@one-kilo/domain/entities/Account"
import type { PersonEntity, PersonMutableFieldKey } from "@one-kilo/domain/entities/Person"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import { PushPersonChangeToWorkOSWorkflow } from "@one-kilo/workflow/PushPersonChangeToWorkOSWorkflowDefinitions"
import * as Arr from "effect/Array"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"

/**
 * WorkOS mirrors a person's name, so a change to either name field must be propagated to the
 * linked WorkOS user.
 */
const WORKOS_MIRRORED_PERSON_FIELDS = ["preferredName", "fullName"] as const satisfies Arr.NonEmptyReadonlyArray<
  PersonMutableFieldKey
>

const changeRequiresSync = (changedFields: Arr.NonEmptyReadonlyArray<PersonMutableFieldKey>) =>
  Arr.some(WORKOS_MIRRORED_PERSON_FIELDS, (field) => Arr.contains(changedFields, field))

type EnqueueIfNeededParameters = {
  readonly auditLog: PersonUpdatedAuditLog
  readonly beforePerson: PersonEntity
  readonly changedFields: Arr.NonEmptyReadonlyArray<PersonMutableFieldKey>
  readonly maybeAccount: Option.Option<PersonAccountEntity>
}

/**
 * Enqueues a workflow that pushes the person change to WorkOS when a person update both touches a
 * WorkOS-mirrored field and belongs to a linked account. A no-op otherwise.
 */
export const enqueueIfNeeded = Effect.fn("PersonWorkOSSync.enqueueIfNeeded")(
  function*({
    auditLog,
    beforePerson,
    changedFields,
    maybeAccount
  }: EnqueueIfNeededParameters) {
    if (Option.isNone(maybeAccount) || !changeRequiresSync(changedFields)) {
      return
    }

    const beforeWorkOsName = yield* pipe(
      beforePerson.deriveWorkOSName(),
      orDieWithUnexpectedError("Failed to derive a WorkOS name from the before-state person")
    )

    yield* PushPersonChangeToWorkOSWorkflow.execute(
      {
        causedByAuditLogId: auditLog.id,
        expected: {
          firstName: beforeWorkOsName.firstName,
          lastName: beforeWorkOsName.lastName
        },
        personId: beforePerson.id
      },
      { discard: true }
    )
  }
)
