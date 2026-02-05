import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import { pipe } from "effect/Function"
import * as ParseResult from "effect/ParseResult"
import * as S from "effect/Schema"

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

export const PrefixedUserId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith("u_"),
  S.brand("@one-kilo/domain/PrefixedUserId"),
  S.annotations({
    description: "The unique identifier for a user.",
    identifier: "PrefixedUserId",
    title: "User ID (Prefixed)"
  })
)
export type PrefixedUserId = typeof PrefixedUserId.Type

export const UserIdFromPrefixed = S.transformOrFail(
  PrefixedUserId,
  S.typeSchema(UserId),
  {
    decode: (fromA, _, ast) =>
      pipe(
        fromA.split("_")[1],
        S.decodeUnknown(UUIDv7.UUIDv7FromShortened),
        ParseResult.mapBoth({
          onFailure: (error) => new ParseResult.Type(ast, fromA, error.message),
          onSuccess: (decoded) => UserId.make(decoded)
        })
      ),
    encode: (toI, _, ast) =>
      pipe(
        S.encode(UUIDv7.UUIDv7FromShortened)(toI),
        ParseResult.mapBoth({
          onFailure: (error) => new ParseResult.Type(ast, toI, error.message),
          onSuccess: (encoded) => PrefixedUserId.make(`u_${encoded}`)
        })
      )
  }
)
