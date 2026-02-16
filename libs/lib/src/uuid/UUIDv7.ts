import * as Either from "effect/Either"
import * as Encoding from "effect/Encoding"
import { identity, pipe } from "effect/Function"
import * as ParseResult from "effect/ParseResult"
import * as S from "effect/Schema"
import { decodeCrockfordBase32, encodeCrockfordBase32, formatHexStringAsUUIDv7 } from "./internal/UUIDv7Utils.ts"

const UUIDv7Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

export const UUIDv7 = pipe(
  S.String,
  S.transform(
    S.typeSchema(S.String),
    {
      decode: (s) => s.toLowerCase(),
      encode: identity
    }
  ),
  S.pattern(UUIDv7Regex),
  S.brand("@one-kilo/lib/UUIDv7"),
  S.annotations({
    identifier: "UUIDv7",
    title: "UUIDv7",
    description: "A UUID version 7 (time-ordered) identifier"
  })
)
export type UUIDv7 = typeof UUIDv7.Type

const ShortenedUUIDv7Regex = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{26}$/

export const ShortenedUUIDv7 = pipe(
  S.String,
  S.transform(
    S.typeSchema(S.String),
    {
      decode: (s) => s.toUpperCase(),
      encode: identity
    }
  ),
  S.pattern(ShortenedUUIDv7Regex),
  S.brand("@one-kilo/lib/ShortenedUUIDv7"),
  S.annotations({
    identifier: "ShortenedUUIDv7",
    title: "UUIDv7 (Shortened)",
    description: "A UUID version 7, encoded without dashes in Crockford's base32"
  })
)
export type ShortenedUUIDv7 = typeof ShortenedUUIDv7.Type

export const UUIDv7FromShortened = S.transformOrFail(
  ShortenedUUIDv7,
  S.typeSchema(UUIDv7),
  {
    decode: (fromA) =>
      pipe(
        decodeCrockfordBase32(fromA),
        Encoding.encodeHex,
        formatHexStringAsUUIDv7,
        ParseResult.succeed
      ),
    encode: (toI, _options, ast) =>
      pipe(
        toI.replace(/-/g, ""),
        Encoding.decodeHex,
        Either.map(encodeCrockfordBase32),
        Either.match({
          onLeft: (e) => ParseResult.fail(new ParseResult.Type(ast, toI, e.message)),
          onRight: (r) => ParseResult.succeed(ShortenedUUIDv7.make(r))
        })
      )
  }
)
