import type { PersonAccountEntity } from "@one-kilo/domain/entities/Account"
import type { PersonEntity, PersonMutableFieldKey } from "@one-kilo/domain/entities/Person"
import { PersonWorkOSSyncEntity } from "@one-kilo/entities/PersonWorkOSSyncEntity"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
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
  readonly afterPerson: PersonEntity
  readonly beforePerson: PersonEntity
  readonly changedFields: Arr.NonEmptyReadonlyArray<PersonMutableFieldKey>
  readonly maybeAccount: Option.Option<PersonAccountEntity>
}

/**
 * Sends the person change to the person's WorkOS sync mailbox when a person update both touches a
 * WorkOS-mirrored field and belongs to a linked account. A no-op otherwise.
 *
 * Must run inside the transaction that updated the person, so the message commits or rolls back
 * with the change.
 */
export const enqueueIfNeeded = Effect.fn("PersonWorkOSSync.enqueueIfNeeded")(
  function*({
    afterPerson,
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

    const makeClient = yield* PersonWorkOSSyncEntity.client

    yield* pipe(
      makeClient(afterPerson.id).Push(
        {
          expected: {
            firstName: beforeWorkOsName.firstName,
            lastName: beforeWorkOsName.lastName
          },
          personVersion: afterPerson.version
        },
        { discard: true }
      ),
      orDieWithUnexpectedError("Failed to send a person change to WorkOS sync")
    )
  }
)
