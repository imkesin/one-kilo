import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import { AthleteEntity } from "@one-kilo/domain/entities/Athlete"
import type { AthleteId } from "@one-kilo/domain/ids/AthleteId"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { PersonId } from "@one-kilo/domain/ids/PersonId"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { AthletesModel } from "./AthletesModel.ts"

type InsertAthleteParameters = {
  personId: PersonId
  performedByUserId: UserId

  id?: AthleteId
}

export class AthletesRepository extends Effect.Service<AthletesRepository>()(
  "@one-kilo/sql/AthletesRepository",
  {
    dependencies: [DomainIdGenerator.Default],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      const idGenerator = yield* DomainIdGenerator

      const insertSchema = SqlSchema.single({
        Request: AthletesModel.insert,
        Result: AthletesModel.select,
        execute: (request) => sql`INSERT INTO athletes ${sql.insert(request).returning("*")}`
      })
      const insert = Effect.fn("AthletesRepository.insert")(
        function*({ personId, id, performedByUserId }: InsertAthleteParameters) {
          const athleteId = id ?? (yield* idGenerator.athleteId)

          const athlete = yield* insertSchema({
            id: athleteId,
            personId,
            createdAt: undefined,
            createdByUserId: performedByUserId,
            updatedAt: undefined,
            updatedByUserId: performedByUserId,
            archivedAt: undefined
          })

          return AthleteEntity.make(athlete)
        },
        orDieWithUnexpectedError("Failed to insert athlete")
      )

      return { insert }
    })
  }
) {}
