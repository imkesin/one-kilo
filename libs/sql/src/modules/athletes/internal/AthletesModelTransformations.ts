import { Athlete } from "@one-kilo/domain/entities/Athlete"
import { CoachOnAthlete } from "@one-kilo/domain/entities/Coach"
import { CoachingRelationshipOnAthlete } from "@one-kilo/domain/entities/CoachingRelationship"
import { PersonEntity } from "@one-kilo/domain/entities/Person"
import * as S from "effect/Schema"
import { CoachesModel } from "../../coaches/CoachesModel.ts"
import { CoachingRelationshipsModel } from "../../coaching-relationships/CoachingRelationshipsModel.ts"
import { PersonsModel } from "../../persons/PersonsModel.ts"
import { AthletesModel } from "../AthletesModel.ts"

const CoachOnAthleteRow = S.Struct({
  ...CoachesModel.select.fields,
  person: PersonsModel.select,
  relationship: CoachingRelationshipsModel.select
})

export const AthleteRow = S.Struct({
  ...AthletesModel.select.fields,
  person: PersonsModel.select,
  coaches: S.Array(CoachOnAthleteRow)
})

export const toAthlete = (row: typeof AthleteRow.Type): Athlete =>
  Athlete.make({
    id: row.id,
    version: row.version,
    person: PersonEntity.make({
      id: row.person.id,
      version: row.person.version,
      preferredName: row.person.preferredName,
      fullName: row.person.fullName,
      sex: row.person.sex,
      dateOfBirth: row.person.dateOfBirth,
      timezone: row.person.timezone,
      createdAt: row.person.createdAt,
      updatedAt: row.person.updatedAt,
      archivedAt: row.person.archivedAt
    }),
    coaches: row.coaches.map((coach) =>
      CoachOnAthlete.make({
        id: coach.id,
        person: PersonEntity.make({
          id: coach.person.id,
          version: coach.person.version,
          preferredName: coach.person.preferredName,
          fullName: coach.person.fullName,
          sex: coach.person.sex,
          dateOfBirth: coach.person.dateOfBirth,
          timezone: coach.person.timezone,
          createdAt: coach.person.createdAt,
          updatedAt: coach.person.updatedAt,
          archivedAt: coach.person.archivedAt
        }),
        relationship: CoachingRelationshipOnAthlete.make({
          id: coach.relationship.id,
          version: coach.relationship.version,
          period: coach.relationship.period,
          addedAt: coach.relationship.createdAt,
          updatedAt: coach.relationship.updatedAt,
          removedAt: coach.relationship.archivedAt
        })
      })
    ),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    archivedAt: row.archivedAt
  })
