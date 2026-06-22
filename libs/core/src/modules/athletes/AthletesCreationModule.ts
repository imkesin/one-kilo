import { AthleteCreatedAuditLog } from "@one-kilo/domain/audit-logs/AthleteAuditLogs"
import type { AthleteId } from "@one-kilo/domain/ids/AthleteId"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { PersonId } from "@one-kilo/domain/ids/PersonId"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import { AthletesRepository } from "@one-kilo/sql/modules/athletes/AthletesRepository"
import { AuditLogsRepository } from "@one-kilo/sql/modules/audit-logs/AuditLogsRepository"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"

type CreateAthleteParameters = {
  personId: PersonId
  performedByUserId: UserId
}

type RecordAthleteCreatedParameters = {
  athlete: { id: AthleteId }
  performedByUserId: UserId
}

export class AthletesCreationModule extends Effect.Service<AthletesCreationModule>()(
  "@one-kilo/core/AthletesCreationModule",
  {
    dependencies: [
      AthletesRepository.Default,
      AuditLogsRepository.Default,
      DomainIdGenerator.Default
    ],
    effect: Effect.gen(function*() {
      const athletesRepository = yield* AthletesRepository
      const auditLogsRepository = yield* AuditLogsRepository
      const idGenerator = yield* DomainIdGenerator

      const recordAthleteCreated = Effect.fn("AthletesCreationModule.recordAthleteCreated")(
        function*({ athlete, performedByUserId }: RecordAthleteCreatedParameters) {
          const id = yield* idGenerator.auditLogId

          const auditLog = yield* AthleteCreatedAuditLog.build({
            id,
            performedByUserId,
            targets: [{ id: athlete.id, type: "Athlete" as const }]
          })

          yield* auditLogsRepository.insert({
            ...auditLog,
            encodedContext: Option.none()
          })
        }
      )

      const createAthlete = Effect.fn("AthletesCreationModule.createAthlete")(
        function*({ personId, performedByUserId }: CreateAthleteParameters) {
          const athlete = yield* athletesRepository.insert({ personId, performedByUserId })

          yield* recordAthleteCreated({ athlete, performedByUserId })

          return athlete
        }
      )

      return { createAthlete }
    })
  }
) {}
