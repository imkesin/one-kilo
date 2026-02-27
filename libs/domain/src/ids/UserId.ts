import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makeIdFromPrefixed } from "./internal/makeIdFromPrefixed.js"

export const UserId = pipe(
  UUIDv7.UUIDv7,
  S.brand("@one-kilo/domain/UserId"),
  S.annotations({
    description: "The unique identifier for a user.",
    identifier: "UserId",
    title: "User ID"
  })
)
export type UserId = typeof UserId.Type

const USER_PREFIX = "usr_"

export const PrefixedUserId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith(USER_PREFIX),
  S.brand("@one-kilo/domain/PrefixedUserId"),
  S.annotations({
    description: "The unique identifier for a user.",
    identifier: "PrefixedUserId",
    title: "User ID (Prefixed)"
  })
)
export type PrefixedUserId = typeof PrefixedUserId.Type

export const UserIdFromPrefixed = makeIdFromPrefixed(
  PrefixedUserId,
  UserId,
  {
    prefix: USER_PREFIX,
    makeId: UserId.make,
    makePrefixed: PrefixedUserId.make
  }
)
