import * as S from "effect/Schema"
import { AthleteId } from "../ids/AthleteId.ts"
import { PersonId } from "../ids/PersonId.ts"
import { CoachOnAthlete } from "./Coach.ts"
import { EntityAuditFields } from "./internal/EntityFields.ts"
import { PersonEntity } from "./Person.ts"

const EntityBaseFields = {
  id: AthleteId,

  personId: PersonId,

  ...EntityAuditFields
} as const

export class AthleteEntity extends S.TaggedClass<AthleteEntity>("@one-kilo/domain/AthleteEntity")(
  "AthleteEntity",
  {
    ...EntityBaseFields
  },
  {
    identifier: "AthleteEntity",
    title: "Athlete Entity",
    description: "The athlete role of a person"
  }
) {}

export class Athlete extends S.TaggedClass<Athlete>("@one-kilo/domain/Athlete")(
  "Athlete",
  {
    id: AthleteId,

    person: PersonEntity,
    coaches: S.Array(CoachOnAthlete),

    ...EntityAuditFields
  },
  {
    identifier: "Athlete",
    title: "Athlete",
    description: "An athlete with its person and active coaches"
  }
) {}
