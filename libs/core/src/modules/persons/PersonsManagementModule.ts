import { PersonUpdatedAuditLog } from "@one-kilo/domain/audit-logs/PersonAuditLogs"
import type { PersonEntity } from "@one-kilo/domain/entities/Person"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { PersonId } from "@one-kilo/domain/ids/PersonId"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import { Actor } from "@one-kilo/domain/tags/Actor"
import type { FullName, PreferredName } from "@one-kilo/domain/values/PersonValues"
import { AuditLogsRepository } from "@one-kilo/sql/modules/audit-logs/AuditLogsRepository"
import { PersonsRepository } from "@one-kilo/sql/modules/persons/PersonsRepository"
import * as Data from "effect/Data"
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

type UpdatePersonOutcome = Data.TaggedEnum<{
  Unchanged: {
    readonly person: PersonEntity
  }
  Updated: {
    readonly auditLog: PersonUpdatedAuditLog
    readonly person: PersonEntity
  }
}>
const UpdatePersonOutcome = Data.taggedEnum<UpdatePersonOutcome>()

export class PersonsManagementModule extends Effect.Service<PersonsManagementModule>()(
  "@one-kilo/core/PersonsManagementModule",
  {
    dependencies: [
      AuditLogsRepository.Default,
      DomainIdGenerator.Default,
      PersonsRepository.Default
    ],
    effect: Effect.gen(function*() {
      const auditLogsRepository = yield* AuditLogsRepository
      const idGenerator = yield* DomainIdGenerator
      const personsRepository = yield* PersonsRepository

      const recordPersonUpdated = Effect.fn("PersonsManagementModule.recordPersonUpdated")(
        function*({ fields, performedByUserId, personId }: RecordPersonUpdatedParameters) {
          const id = yield* idGenerator.auditLogId

          const auditLog = yield* PersonUpdatedAuditLog.build({
            id,
            performedByUserId,
            targets: [{ id: personId, type: "Person" as const }],
            context: { fields }
          })

          yield* auditLogsRepository.insert(auditLog.withEncodedContext())

          return auditLog
        }
      )

      const updatePerson = Effect.fn("PersonsManagementModule.updatePerson")(
        function*(person: PersonEntity, fields: UpdatePersonFields) {
          const diffOutcome = person.diff(fields)

          if (diffOutcome._tag === "Unchanged") {
            return UpdatePersonOutcome.Unchanged({ person })
          }

          const changedFields = diffOutcome.fields
          const performedByUserId = yield* Effect.map(Actor, ({ user }) => user.id)

          const updatedPerson = yield* personsRepository.update(
            person.id,
            {
              fields: changedFields,
              performedByUserId
            }
          )

          const auditLog = yield* recordPersonUpdated({
            fields: changedFields,
            performedByUserId,
            personId: person.id
          })

          return UpdatePersonOutcome.Updated({
            auditLog,
            person: updatedPerson
          })
        }
      )

      return { updatePerson }
    })
  }
) {}
