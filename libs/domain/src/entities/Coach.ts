import * as S from "effect/Schema"
import { CoachId } from "../ids/CoachId.ts"
import { PersonId } from "../ids/PersonId.ts"
import { CoachingRelationshipOnAthlete } from "./CoachingRelationship.ts"
import { EntityAuditFields } from "./internal/EntityFields.ts"
import { PersonEntity } from "./Person.ts"

const EntityBaseFields = {
  id: CoachId,

  personId: PersonId,

  ...EntityAuditFields
} as const

export class CoachEntity extends S.TaggedClass<CoachEntity>("@one-kilo/domain/CoachEntity")(
  "CoachEntity",
  {
    ...EntityBaseFields
  },
  {
    identifier: "CoachEntity",
    title: "Coach Entity",
    description: "The coach role of a person"
  }
) {}

export class CoachOnAthlete extends S.TaggedClass<CoachOnAthlete>("@one-kilo/domain/CoachOnAthlete")(
  "CoachOnAthlete",
  {
    id: CoachId,

    person: PersonEntity,
    relationship: CoachingRelationshipOnAthlete
  },
  {
    identifier: "CoachOnAthlete",
    title: "Coach (on Athlete)",
    description: "A coach related to an athlete, with the coaching relationship"
  }
) {}
