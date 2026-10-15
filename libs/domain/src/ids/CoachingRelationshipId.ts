import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makeIdFromPrefixed } from "./internal/makeIdFromPrefixed.js"

export const CoachingRelationshipId = pipe(
  UUIDv7.UUIDv7,
  S.brand("@one-kilo/domain/CoachingRelationshipId"),
  S.annotate({
    description: "The unique identifier for a coaching relationship.",
    identifier: "CoachingRelationshipId",
    title: "Coaching Relationship ID"
  })
)
export type CoachingRelationshipId = typeof CoachingRelationshipId.Type

const COACHING_RELATIONSHIP_PREFIX = "coaching_relationship_"

export const PrefixedCoachingRelationshipId = pipe(
  S.Trimmed.check(S.isNonEmpty()),
  S.check(S.isStartingWith(COACHING_RELATIONSHIP_PREFIX)),
  S.brand("@one-kilo/domain/PrefixedCoachingRelationshipId"),
  S.annotate({
    description: "The unique identifier for a coaching relationship.",
    identifier: "PrefixedCoachingRelationshipId",
    title: "Coaching Relationship ID (Prefixed)"
  })
)
export type PrefixedCoachingRelationshipId = typeof PrefixedCoachingRelationshipId.Type

export const CoachingRelationshipIdFromPrefixed = makeIdFromPrefixed(
  PrefixedCoachingRelationshipId,
  CoachingRelationshipId,
  {
    prefix: COACHING_RELATIONSHIP_PREFIX,
    makeId: CoachingRelationshipId.make,
    makePrefixed: PrefixedCoachingRelationshipId.make
  }
)
