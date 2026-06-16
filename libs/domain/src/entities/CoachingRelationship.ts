import * as S from "effect/Schema"
import { AthleteId } from "../ids/AthleteId.ts"
import { CoachId } from "../ids/CoachId.ts"
import { CoachingRelationshipId } from "../ids/CoachingRelationshipId.ts"
import { LocalDateRange } from "../values/LocalDateRange.ts"
import { EntityRelationAuditFields } from "./internal/EntityFields.ts"

const EntityBaseFields = {
  id: CoachingRelationshipId,

  coachId: CoachId,
  athleteId: AthleteId,

  period: LocalDateRange,

  ...EntityRelationAuditFields
} as const

export class CoachingRelationship extends S.TaggedClass<CoachingRelationship>("@one-kilo/domain/CoachingRelationship")(
  "CoachingRelationship",
  {
    ...EntityBaseFields
  },
  {
    identifier: "CoachingRelationship",
    title: "Coaching Relationship",
    description: "An association between a coach and an athlete over a period of time"
  }
) {}
