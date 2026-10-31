import { PersonsQueryModule } from "@one-kilo/core/modules/persons/PersonsQueryModule"
import * as PersonToWorkOS from "@one-kilo/core/processes/persons/PersonToWorkOS"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as PersonToWorkOSOutbox from "@one-kilo/mailboxes/PersonToWorkOSOutbox"
import * as ClusterEntity from "effect/cluster/Entity"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Schedule from "effect/Schedule"
import * as S from "effect/Schema"

/*
 * Failures are retried here, per message, rather than through the entity's defect retry policy:
 * that policy's backoff is shared by every person (built once per entity type), so one stuck person
 * would slow everyone else's recovery. The person's later updates wait behind this one.
 */
const PushUpdateRetrySchedule = Schedule.min([
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

const EntityLayerWithoutDependencies = PersonToWorkOSOutbox.Entity.toLayer(
  Effect.gen(function*() {
    const { entityId } = yield* ClusterEntity.CurrentAddress

    const personId = yield* pipe(
      decodePersonId(entityId),
      orDieWithUnexpectedError("A PersonToWorkOSOutbox entity ID is not a person ID", { entityId })
    )

    return PersonToWorkOSOutbox.Entity.of({
      pushUpdate: Effect.fnUntraced(
        function*({ payload }) {
          const outcome = yield* pipe(
            PersonToWorkOS.pushUpdate({ personId, expected: payload.expected }),
            Effect.tapError((error) => Effect.logWarning("Failed to push a person update to WorkOS, retrying", error)),
            Effect.retry(PushUpdateRetrySchedule),
            /*
             * Unreachable: the schedule never ends. Narrows the error channel to `never`.
             */
            Effect.orDie
          )

          if (outcome._tag === "DriftDetected") {
            yield* Effect.log("The WorkOS user changed since the push was sent; skipped the push")
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

export const EntityLayer = pipe(
  EntityLayerWithoutDependencies,
  Layer.provide(PersonsQueryModule.layer)
)
