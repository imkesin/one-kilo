import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makeIdFromPrefixed } from "./internal/makeIdFromPrefixed.js"

export const AccountId = pipe(
  UUIDv7.UUIDv7,
  S.brand("@one-kilo/domain/AccountId"),
  S.annotations({
    description: "The unique identifier for an account.",
    identifier: "AccountId",
    title: "Account ID"
  })
)
export type AccountId = typeof AccountId.Type

const ACCOUNT_PREFIX = "account_"

export const PrefixedAccountId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith(ACCOUNT_PREFIX),
  S.brand("@one-kilo/domain/PrefixedAccountId"),
  S.annotations({
    description: "The unique identifier for an account.",
    identifier: "PrefixedAccountId",
    title: "Account ID (Prefixed)"
  })
)
export type PrefixedAccountId = typeof PrefixedAccountId.Type

export const AccountIdFromPrefixed = makeIdFromPrefixed(
  PrefixedAccountId,
  AccountId,
  {
    prefix: ACCOUNT_PREFIX,
    makeId: AccountId.make,
    makePrefixed: PrefixedAccountId.make
  }
)
