import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makeIdFromPrefixed } from "./internal/makeIdFromPrefixed.js"

export const PersonId = pipe(
  UUIDv7.UUIDv7,
  S.brand("@one-kilo/domain/PersonId"),
  S.annotations({
    description: "The unique identifier for a person.",
    identifier: "PersonId",
    title: "Person ID"
  })
)
export type PersonId = typeof PersonId.Type

const PERSON_PREFIX = "prsn_"

export const PrefixedPersonId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith(PERSON_PREFIX),
  S.brand("@one-kilo/domain/PrefixedPersonId"),
  S.annotations({
    description: "The unique identifier for a person.",
    identifier: "PrefixedPersonId",
    title: "Person ID (Prefixed)"
  })
)
export type PrefixedPersonId = typeof PrefixedPersonId.Type

export const PersonIdFromPrefixed = makeIdFromPrefixed(
  PrefixedPersonId,
  PersonId,
  {
    prefix: PERSON_PREFIX,
    makeId: PersonId.make,
    makePrefixed: PrefixedPersonId.make
  }
)
