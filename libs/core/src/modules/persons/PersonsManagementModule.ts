import { PersonUpdatedActivityLog } from "@one-kilo/domain/activity-logs/PersonActivityLogs"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { PersonId } from "@one-kilo/domain/ids/PersonId"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import { Actor } from "@one-kilo/domain/tags/Actor"
import type { FullName, PreferredName } from "@one-kilo/domain/values/PersonValues"
import { ActivityLogsRepository } from "@one-kilo/sql/modules/activity-logs/ActivityLogsRepository"
import { PersonsRepository } from "@one-kilo/sql/modules/persons/PersonsRepository"
import * as Effect from "effect/Effect"

type UpdatePersonFields = {
  readonly preferredName?: PreferredName
  readonly fullName?: FullName
}

type RecordPersonUpdatedParameters = {
  readonly fields: UpdatePersonFields
  readonly performedByUserId: UserId
  readonly personId: PersonId
}

type UpdatePersonParameters = {
  readonly personId: PersonId
  readonly fields: UpdatePersonFields
}

export class PersonsManagementModule extends Effect.Service<PersonsManagementModule>()(
  "@one-kilo/core/PersonsManagementModule",
  {
    dependencies: [
      ActivityLogsRepository.Default,
      DomainIdGenerator.Default,
      PersonsRepository.Default
    ],
    effect: Effect.gen(function*() {
      const activityLogsRepository = yield* ActivityLogsRepository
      const idGenerator = yield* DomainIdGenerator
      const personsRepository = yield* PersonsRepository

      const recordPersonUpdated = Effect.fn("PersonsManagementModule.recordPersonUpdated")(
        function*({ fields, performedByUserId, personId }: RecordPersonUpdatedParameters) {
          const id = yield* idGenerator.activityLogId

          const activityLog = yield* PersonUpdatedActivityLog.build({
            id,
            performedByUserId,
            targets: [{ id: personId, type: "Person" as const }],
            context: { fields }
          })

          yield* activityLogsRepository.insert(activityLog.withEncodedContext())
        }
      )

      const updatePerson = Effect.fn("PersonsManagementModule.updatePerson")(
        function*({ personId, fields }: UpdatePersonParameters) {
          const performedByUserId = yield* Effect.map(Actor, ({ user }) => user.id)

          const person = yield* personsRepository.update(
            personId,
            {
              fields,
              performedByUserId
            }
          )

          yield* recordPersonUpdated({ fields, performedByUserId, personId })

          return person
        }
      )

      return { updatePerson }
    })
  }
) {}
