import { PersonsToWorkOSRelay } from "@one-kilo/core/relays/persons/PersonsToWorkOSRelay"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import { PersonToWorkOSOutbox } from "@one-kilo/mailboxes/PersonToWorkOSOutbox"
import * as ClusterEntity from "effect/cluster/Entity"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Schedule from "effect/Schedule"
import * as S from "effect/Schema"

/*
 * Failures are retried here, per message, rather than through the entity's defect retry policy:
 */
const RelayRetrySchedule = Schedule.min([
  Schedule.exponential("5 seconds"),
  Schedule.spaced("1 hour")
])

/*
 * Only defects (bugs, database outages) reach the entity's policy. Kept short because its backoff is
 * shared across persons. Infinite, so the default policy never takes over.
 */
const DefectRetrySchedule = Schedule.min([
  Schedule.exponential("1 second"),
  Schedule.spaced("1 minute")
])

const decodePersonId = S.decodeUnknownEffect(PersonId)

const HandlersWithoutDependencies = PersonToWorkOSOutbox.toLayer(
  Effect.gen(function*() {
    const { entityId } = yield* ClusterEntity.CurrentAddress
    const personsToWorkOSRelay = yield* PersonsToWorkOSRelay

    const personId = yield* pipe(
      decodePersonId(entityId),
      orDieWithUnexpectedError("A PersonToWorkOSOutbox entity ID is not a person ID", { entityId })
    )

    return PersonToWorkOSOutbox.of({
      PersonUpdated: Effect.fnUntraced(
        function*({ payload }) {
          const outcome = yield* pipe(
            personsToWorkOSRelay.relayUpdate({ personId, expected: payload.expected }),
            Effect.tapError((error) => Effect.logWarning("Failed to relay a person update to WorkOS, retrying", error)),
            Effect.retry(RelayRetrySchedule),
            /*
             * Unreachable: the schedule never ends. Narrows the error channel to `never`.
             */
            Effect.orDie
          )

          if (outcome._tag === "DriftDetected") {
            yield* Effect.log("The WorkOS user changed since the update was sent; skipped relaying it")
          }

          return outcome._tag
        },
        (effect, { payload }) =>
          Effect.annotateLogs(effect, {
            personId,
            personVersion: payload.personVersion
          })
      )
    })
  }),
  { defectRetryPolicy: DefectRetrySchedule }
)

export const PersonToWorkOSOutboxHandlers = pipe(
  HandlersWithoutDependencies,
  Layer.provide(PersonsToWorkOSRelay.layer)
)
