import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makeIdFromPrefixed } from "./internal/makeIdFromPrefixed.js"

export const CoachId = pipe(
  UUIDv7.UUIDv7,
  S.brand("@one-kilo/domain/CoachId"),
  S.annotations({
    description: "The unique identifier for a coach.",
    identifier: "CoachId",
    title: "Coach ID"
  })
)
export type CoachId = typeof CoachId.Type

const COACH_PREFIX = "coa_"

export const PrefixedCoachId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith(COACH_PREFIX),
  S.brand("@one-kilo/domain/PrefixedCoachId"),
  S.annotations({
    description: "The unique identifier for a coach.",
    identifier: "PrefixedCoachId",
    title: "Coach ID (Prefixed)"
  })
)
export type PrefixedCoachId = typeof PrefixedCoachId.Type

export const CoachIdFromPrefixed = makeIdFromPrefixed(
  PrefixedCoachId,
  CoachId,
  {
    prefix: COACH_PREFIX,
    makeId: CoachId.make,
    makePrefixed: PrefixedCoachId.make
  }
)
