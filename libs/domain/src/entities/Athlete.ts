import * as S from "effect/Schema"
import { AthleteId } from "../ids/AthleteId.ts"
import { PersonId } from "../ids/PersonId.ts"
import { EntityAuditFields } from "./internal/EntityFields.ts"

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
