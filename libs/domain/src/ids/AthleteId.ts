import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makeIdFromPrefixed } from "./internal/makeIdFromPrefixed.js"

export const AthleteId = pipe(
  UUIDv7.UUIDv7,
  S.brand("@one-kilo/domain/AthleteId"),
  S.annotations({
    description: "The unique identifier for an athlete.",
    identifier: "AthleteId",
    title: "Athlete ID"
  })
)
export type AthleteId = typeof AthleteId.Type

const ATHLETE_PREFIX = "ath_"

export const PrefixedAthleteId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith(ATHLETE_PREFIX),
  S.brand("@one-kilo/domain/PrefixedAthleteId"),
  S.annotations({
    description: "The unique identifier for an athlete.",
    identifier: "PrefixedAthleteId",
    title: "Athlete ID (Prefixed)"
  })
)
export type PrefixedAthleteId = typeof PrefixedAthleteId.Type

export const AthleteIdFromPrefixed = makeIdFromPrefixed(
  PrefixedAthleteId,
  AthleteId,
  {
    prefix: ATHLETE_PREFIX,
    makeId: AthleteId.make,
    makePrefixed: PrefixedAthleteId.make
  }
)
