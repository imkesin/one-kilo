import type { PersonAccountEntity } from "@one-kilo/domain/entities/Account"
import type { PersonEntity, PersonMutableFieldKey } from "@one-kilo/domain/entities/Person"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as PersonToWorkOSOutbox from "@one-kilo/mailboxes/PersonToWorkOSOutbox"
import * as Arr from "effect/Array"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"

/**
 * WorkOS mirrors a person's name, so a change to either name field must be propagated to the
 * linked WorkOS user.
 */
const WORKOS_MIRRORED_PERSON_FIELDS = [
  "preferredName",
  "fullName"
] as const satisfies Arr.NonEmptyReadonlyArray<PersonMutableFieldKey>

const changeRequiresPush = (changedFields: Arr.NonEmptyReadonlyArray<PersonMutableFieldKey>) =>
  Arr.some(
    WORKOS_MIRRORED_PERSON_FIELDS,
    (field) => Arr.contains(changedFields, field)
  )

type PushUpdateIfNeededParameters = {
  readonly afterPerson: PersonEntity
  readonly beforePerson: PersonEntity
  readonly changedFields: Arr.NonEmptyReadonlyArray<PersonMutableFieldKey>
  readonly maybeAccount: Option.Option<PersonAccountEntity>
}

/**
 * Sends the person update to the person's WorkOS outbox when it both touches a WorkOS-mirrored
 * field and belongs to a linked account. A no-op otherwise.
 *
 * Must run inside the transaction that updated the person, so the message commits or rolls back
 * with the change.
 */
export const pushUpdateIfNeeded = Effect.fn("PersonToWorkOSOutbox.pushUpdateIfNeeded")(
  function*({
    afterPerson,
    beforePerson,
    changedFields,
    maybeAccount
  }: PushUpdateIfNeededParameters) {
    if (Option.isNone(maybeAccount) || !changeRequiresPush(changedFields)) {
      return
    }

    const beforeWorkOsName = yield* pipe(
      beforePerson.deriveWorkOSName(),
      orDieWithUnexpectedError("Failed to derive a WorkOS name from the before-state person")
    )

    const makeClient = yield* PersonToWorkOSOutbox.Entity.client

    yield* pipe(
      makeClient(afterPerson.id).PushUpdate(
        {
          expected: {
            firstName: beforeWorkOsName.firstName,
            lastName: beforeWorkOsName.lastName
          },
          personVersion: afterPerson.version
        },
        { discard: true }
      ),
      orDieWithUnexpectedError("Failed to send a person update to the WorkOS outbox")
    )
  }
)
