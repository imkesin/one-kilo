import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import { AthleteEntity } from "@one-kilo/domain/entities/Athlete"
import { AthleteId } from "@one-kilo/domain/ids/AthleteId"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import { CoachesModel } from "../coaches/CoachesModel.ts"
import { CoachingRelationshipsModel } from "../coaching-relationships/CoachingRelationshipsModel.ts"
import { PersonsModel } from "../persons/PersonsModel.ts"
import { AthletesModel } from "./AthletesModel.ts"
import { AthleteRow, toAthlete } from "./internal/AthletesModelTransformations.ts"

type FindAthleteEntityByPersonIdParameters = {
  personId: PersonId
}
type FindAthleteEntityByIdParameters = {
  athleteId: AthleteId
}
type FindAthleteByIdParameters = {
  athleteId: AthleteId
}

export class AthletesQueryRepository extends Effect.Service<AthletesQueryRepository>()(
  "@one-kilo/sql/AthletesQueryRepository",
  {
    dependencies: [],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient

      const findAthleteByIdSchema = SqlSchema.findOne({
        Request: AthleteId,
        Result: AthleteRow,
        execute: (athleteId) =>
          sql`
            SELECT
              ath.*,
              ${sql.unsafe(PersonsModel.asJsonBBuildObject({ alias: "p" }))} AS person,
              COALESCE(
                (
                  SELECT JSONB_AGG(
                    ${sql.unsafe(CoachesModel.asJsonBBuildObject({ alias: "coa" }))}
                    || JSONB_BUILD_OBJECT(
                      'person', ${sql.unsafe(PersonsModel.asJsonBBuildObject({ alias: "cp" }))},
                      'relationship', ${sql.unsafe(CoachingRelationshipsModel.asJsonBBuildObject({ alias: "cr" }))}
                    )
                  )
                  FROM coaching_relationships cr
                  JOIN coaches coa ON coa.id = cr.coach_id AND coa.archived_at IS NULL
                  JOIN persons cp ON cp.id = coa.person_id AND cp.archived_at IS NULL
                  WHERE
                    cr.athlete_id = ath.id
                    AND cr.archived_at IS NULL
                    AND cr.period @> CURRENT_DATE
                ),
                '[]'::jsonb
              ) AS coaches
            FROM athletes ath
            JOIN persons p ON p.id = ath.person_id AND p.archived_at IS NULL
            WHERE
              ath.id = ${athleteId}
              AND ath.archived_at IS NULL
            LIMIT 1
          `
      })
      const findAthleteById = Effect.fn("AthletesQueryRepository.findAthleteById")(
        function*({ athleteId }: FindAthleteByIdParameters) {
          return yield* Effect.map(
            findAthleteByIdSchema(athleteId),
            Option.map(toAthlete)
          )
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding an athlete")
      )

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
        findAthleteById,
        findAthleteEntityById,
        findAthleteEntityByPersonId
      }
    })
  }
) {}
