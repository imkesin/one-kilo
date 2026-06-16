import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makeIdFromPrefixed } from "./internal/makeIdFromPrefixed.js"

export const CoachingRelationshipId = pipe(
  UUIDv7.UUIDv7,
  S.brand("@one-kilo/domain/CoachingRelationshipId"),
  S.annotations({
    description: "The unique identifier for a coaching relationship.",
    identifier: "CoachingRelationshipId",
    title: "Coaching Relationship ID"
  })
)
export type CoachingRelationshipId = typeof CoachingRelationshipId.Type

const COACHING_RELATIONSHIP_PREFIX = "cr_"

export const PrefixedCoachingRelationshipId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith(COACHING_RELATIONSHIP_PREFIX),
  S.brand("@one-kilo/domain/PrefixedCoachingRelationshipId"),
  S.annotations({
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
