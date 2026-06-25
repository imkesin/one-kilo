import type { PersonUpdatedAuditLog } from "@one-kilo/domain/audit-logs/PersonAuditLogs"
import type { PersonEntity, PersonMutableFieldKey } from "@one-kilo/domain/entities/Person"
import type { PersonUserEntity } from "@one-kilo/domain/entities/User"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import { PushWorkOSUserChangeWorkflow } from "@one-kilo/workflow/PushWorkOSUserChangeWorkflowDefinitions"
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
  readonly maybeUser: Option.Option<PersonUserEntity>
}

/**
 * Enqueues a WorkOS user-change workflow when a person update both touches a WorkOS-mirrored field
 * and belongs to a linked user. A no-op otherwise.
 */
export const enqueueIfNeeded = Effect.fn("PersonWorkOSSync.enqueueIfNeeded")(
  function*({
    auditLog,
    beforePerson,
    changedFields,
    maybeUser
  }: EnqueueIfNeededParameters) {
    if (Option.isNone(maybeUser) || !changeRequiresSync(changedFields)) {
      return
    }

    const beforeWorkOsName = yield* pipe(
      beforePerson.deriveWorkOSName(),
      orDieWithUnexpectedError("Failed to derive a WorkOS name from the before-state person")
    )

    yield* PushWorkOSUserChangeWorkflow.execute(
      {
        causedByAuditLogId: auditLog.id,
        expected: {
          firstName: beforeWorkOsName.firstName,
          lastName: beforeWorkOsName.lastName
        },
        workosUserId: maybeUser.value.workosUserId
      },
      { discard: true }
    )
  }
)
