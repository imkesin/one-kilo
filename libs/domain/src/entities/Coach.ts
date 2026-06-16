import * as S from "effect/Schema"
import { CoachId } from "../ids/CoachId.ts"
import { PersonId } from "../ids/PersonId.ts"
import { EntityAuditFields } from "./internal/EntityFields.ts"

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
