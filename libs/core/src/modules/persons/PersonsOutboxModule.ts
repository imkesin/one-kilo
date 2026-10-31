import type { PersonAccountEntity } from "@one-kilo/domain/entities/Account"
import type { PersonEntity, PersonMutableFieldKey } from "@one-kilo/domain/entities/Person"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as PersonToWorkOSOutbox from "@one-kilo/mailboxes/PersonToWorkOSOutbox"
import * as Arr from "effect/Array"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"

/**
 * WorkOS mirrors a person's name, so a change to either name field must be propagated to the
 * linked WorkOS user.
 */
const WORKOS_MIRRORED_PERSON_FIELDS = [
  "preferredName",
  "fullName"
] as const satisfies Arr.NonEmptyReadonlyArray<PersonMutableFieldKey>

const changeRequiresWorkOSPush = (changedFields: Arr.NonEmptyReadonlyArray<PersonMutableFieldKey>) =>
  Arr.some(
    WORKOS_MIRRORED_PERSON_FIELDS,
    (field) => Arr.contains(changedFields, field)
  )

type HandleUpdateParameters = {
  readonly afterPerson: PersonEntity
  readonly beforePerson: PersonEntity
  readonly changedFields: Arr.NonEmptyReadonlyArray<PersonMutableFieldKey>
  readonly maybeAccount: Option.Option<PersonAccountEntity>
}

/**
 * Sends person changes to the outboxes of the external systems that mirror them.
 *
 * Must run inside the transaction that changed the person, so the messages commit or roll back with
 * the change.
 */
export class PersonsOutboxModule extends Context.Service<PersonsOutboxModule>()(
  "@one-kilo/core/PersonsOutboxModule",
  {
    make: Effect.gen(function*() {
      const makePersonToWorkOSOutboxClient = yield* PersonToWorkOSOutbox.Entity.client

      const handleUpdate = Effect.fn("PersonsOutboxModule.handleUpdate")(
        function*({
          afterPerson,
          beforePerson,
          changedFields,
          maybeAccount
        }: HandleUpdateParameters) {
          if (Option.isNone(maybeAccount) || !changeRequiresWorkOSPush(changedFields)) {
            return
          }

          const beforeWorkOSName = yield* pipe(
            beforePerson.deriveWorkOSName(),
            orDieWithUnexpectedError("Failed to derive a WorkOS name from the before-state person")
          )

          yield* pipe(
            makePersonToWorkOSOutboxClient(afterPerson.id).pushUpdate(
              {
                expected: {
                  firstName: beforeWorkOSName.firstName,
                  lastName: beforeWorkOSName.lastName
                },
                personVersion: afterPerson.version
              },
              { discard: true }
            ),
            orDieWithUnexpectedError("Failed to send a person update to the WorkOS outbox")
          )
        }
      )

      return { handleUpdate }
    })
  }
) {
  static readonly layer = Layer.effect(this, this.make)
}
