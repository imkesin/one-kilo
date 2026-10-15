import { AthleteEntity } from "@one-kilo/domain/entities/Athlete"
import type { AccountId } from "@one-kilo/domain/ids/AccountId"
import type { AthleteId } from "@one-kilo/domain/ids/AthleteId"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { PersonId } from "@one-kilo/domain/ids/PersonId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as SqlClient from "effect/sql/SqlClient"
import * as SqlSchemaExtensions from "../../utils/SqlSchemaExtensions.ts"
import { AthletesModel } from "./AthletesModel.ts"

type InsertAthleteParameters = {
  personId: PersonId
  performedByAccountId: AccountId

  id?: AthleteId
}

export class AthletesRepository extends Context.Service<AthletesRepository>()(
  "@one-kilo/sql/AthletesRepository",
  {
    make: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      const idGenerator = yield* DomainIdGenerator

      const insertSchema = SqlSchemaExtensions.findOneWithRequestDefaults({
        Request: AthletesModel.insert,
        Result: AthletesModel.select,
        execute: (request) => sql`INSERT INTO athletes ${sql.insert(request).returning("*")}`
      })
      const insert = Effect.fn("AthletesRepository.insert")(
        function*({ personId, id, performedByAccountId }: InsertAthleteParameters) {
          const athleteId = id ?? (yield* idGenerator.athleteId)

          const athlete = yield* insertSchema({
            id: athleteId,
            personId,
            createdAt: undefined,
            createdByAccountId: performedByAccountId,
            updatedAt: undefined,
            updatedByAccountId: performedByAccountId,
            archivedAt: undefined
          })

          return AthleteEntity.make(athlete)
        },
        orDieWithUnexpectedError("Failed to insert athlete")
      )

      return { insert }
    })
  }
) {
  static readonly layer = pipe(
    Layer.effect(this, this.make),
    Layer.provide(DomainIdGenerator.layer)
  )
}
