import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import { AthleteEntity } from "@one-kilo/domain/entities/Athlete"
import { AthleteId } from "@one-kilo/domain/ids/AthleteId"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import { AthletesModel } from "./AthletesModel.ts"

type FindAthleteEntityByPersonIdParameters = {
  personId: PersonId
}
type FindAthleteEntityByIdParameters = {
  athleteId: AthleteId
}

export class AthletesQueryRepository extends Effect.Service<AthletesQueryRepository>()(
  "@one-kilo/sql/AthletesQueryRepository",
  {
    dependencies: [],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient

      const findAthleteEntityByIdSchema = SqlSchema.findOne({
        Request: AthleteId,
        Result: AthletesModel.select,
        execute: (athleteId) =>
          sql`
            SELECT *
            FROM athletes ath
            WHERE
              ath.id = ${athleteId}
              AND ath.archived_at IS NULL
            LIMIT 1
          `
      })
      const findAthleteEntityById = Effect.fn("AthletesQueryRepository.findAthleteEntityById")(
        function*({ athleteId }: FindAthleteEntityByIdParameters) {
          return yield* Effect.map(
            findAthleteEntityByIdSchema(athleteId),
            Option.map((_) => AthleteEntity.make(_))
          )
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding an athlete")
      )

      const findAthleteEntityByPersonIdSchema = SqlSchema.findOne({
        Request: PersonId,
        Result: AthletesModel.select,
        execute: (personId) =>
          sql`
            SELECT *
            FROM athletes ath
            WHERE
              ath.person_id = ${personId}
              AND ath.archived_at IS NULL
            LIMIT 1
          `
      })
      const findAthleteEntityByPersonId = Effect.fn("AthletesQueryRepository.findAthleteEntityByPersonId")(
        function*({ personId }: FindAthleteEntityByPersonIdParameters) {
          return yield* Effect.map(
            findAthleteEntityByPersonIdSchema(personId),
            Option.map((_) => AthleteEntity.make(_))
          )
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding an athlete")
      )

      return {
        findAthleteEntityById,
        findAthleteEntityByPersonId
      }
    })
  }
) {}
