import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makeIdFromPrefixed } from "./internal/makeIdFromPrefixed.js"

export const EmailAddressId = pipe(
  UUIDv7.UUIDv7,
  S.brand("@one-kilo/domain/EmailAddressId"),
  S.annotations({
    description: "The unique identifier for an email address.",
    identifier: "EmailAddressId",
    title: "Email Address ID"
  })
)
export type EmailAddressId = typeof EmailAddressId.Type

const EMAIL_ADDRESS_PREFIX = "ea_"

export const PrefixedEmailAddressId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith(EMAIL_ADDRESS_PREFIX),
  S.brand("@one-kilo/domain/PrefixedEmailAddressId"),
  S.annotations({
    description: "The unique identifier for an email address.",
    identifier: "PrefixedEmailAddressId",
    title: "Email Address ID (Prefixed)"
  })
)
export type PrefixedEmailAddressId = typeof PrefixedEmailAddressId.Type

export const EmailAddressIdFromPrefixed = makeIdFromPrefixed(
  PrefixedEmailAddressId,
  EmailAddressId,
  {
    prefix: EMAIL_ADDRESS_PREFIX,
    makeId: EmailAddressId.make,
    makePrefixed: PrefixedEmailAddressId.make
  }
)
