import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { AggregateVersion } from "./internal/AggregateVersion.ts"

export const CoachingRelationshipVersion = pipe(
  AggregateVersion,
  S.brand("@one-kilo/domain/CoachingRelationshipVersion"),
  S.annotate({
    description: "The version of a coaching relationship, incremented with every committed change.",
    identifier: "CoachingRelationshipVersion",
    title: "Coaching Relationship Version"
  })
)
export type CoachingRelationshipVersion = typeof CoachingRelationshipVersion.Type
