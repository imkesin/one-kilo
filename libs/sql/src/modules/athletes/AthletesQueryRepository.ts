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
              athletes.*,
              ${sql.unsafe(PersonsModel.asJsonBBuildObject())} AS person,
              COALESCE(
                (
                  SELECT JSONB_AGG(
                    ${sql.unsafe(CoachesModel.asJsonBBuildObject())}
                    || JSONB_BUILD_OBJECT(
                      'person', ${sql.unsafe(PersonsModel.asJsonBBuildObject({ alias: "coach_persons" }))},
                      'relationship', ${sql.unsafe(CoachingRelationshipsModel.asJsonBBuildObject())}
                    )
                  )
                  FROM coaching_relationships
                  JOIN coaches ON coaches.id = coaching_relationships.coach_id AND coaches.archived_at IS NULL
                  JOIN persons coach_persons ON coach_persons.id = coaches.person_id AND coach_persons.archived_at IS NULL
                  WHERE
                    coaching_relationships.athlete_id = athletes.id
                    AND coaching_relationships.archived_at IS NULL
                    AND coaching_relationships.period @> CURRENT_DATE
                ),
                '[]'::jsonb
              ) AS coaches
            FROM athletes
            JOIN persons ON persons.id = athletes.person_id AND persons.archived_at IS NULL
            WHERE
              athletes.id = ${athleteId}
              AND athletes.archived_at IS NULL
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
            FROM athletes
            WHERE
              athletes.id = ${athleteId}
              AND athletes.archived_at IS NULL
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
            FROM athletes
            WHERE
              athletes.person_id = ${personId}
              AND athletes.archived_at IS NULL
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
