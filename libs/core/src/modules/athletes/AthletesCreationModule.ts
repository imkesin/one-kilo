import { AthleteCreatedAuditLog } from "@one-kilo/domain/audit-logs/AthleteAuditLogs"
import type { AccountId } from "@one-kilo/domain/ids/AccountId"
import type { AthleteId } from "@one-kilo/domain/ids/AthleteId"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { PersonId } from "@one-kilo/domain/ids/PersonId"
import { AthletesRepository } from "@one-kilo/sql/modules/athletes/AthletesRepository"
import { AuditLogsRepository } from "@one-kilo/sql/modules/audit-logs/AuditLogsRepository"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"

type CreateAthleteParameters = {
  personId: PersonId
  performedByAccountId: AccountId
}

type RecordAthleteCreatedParameters = {
  athlete: { id: AthleteId }
  performedByAccountId: AccountId
}

export class AthletesCreationModule extends Context.Service<AthletesCreationModule>()(
  "@one-kilo/core/AthletesCreationModule",
  {
    make: Effect.gen(function*() {
      const athletesRepository = yield* AthletesRepository
      const auditLogsRepository = yield* AuditLogsRepository
      const idGenerator = yield* DomainIdGenerator

      const recordAthleteCreated = Effect.fn("AthletesCreationModule.recordAthleteCreated")(
        function*({ athlete, performedByAccountId }: RecordAthleteCreatedParameters) {
          const id = yield* idGenerator.auditLogId

          const auditLog = yield* AthleteCreatedAuditLog.build({
            id,
            performedByAccountId,
            targets: [{ id: athlete.id, type: "Athlete" as const }]
          })

          yield* auditLogsRepository.insert(auditLog)
        }
      )

      const createAthlete = Effect.fn("AthletesCreationModule.createAthlete")(
        function*({ personId, performedByAccountId }: CreateAthleteParameters) {
          const athlete = yield* athletesRepository.insert({ personId, performedByAccountId })

          yield* recordAthleteCreated({ athlete, performedByAccountId })

          return athlete
        }
      )

      return { createAthlete }
    })
  }
) {
  static readonly layer = pipe(
    Layer.effect(this, this.make),
    Layer.provide([
      AthletesRepository.layer,
      AuditLogsRepository.layer,
      DomainIdGenerator.layer
    ])
  )
}
