import * as Effect from "effect/Effect"
import * as Hex from "effect/encoding/Hex"
import { pipe } from "effect/Function"
import * as Result from "effect/Result"
import * as S from "effect/Schema"
import * as SchemaGetter from "effect/SchemaGetter"
import * as SchemaIssue from "effect/SchemaIssue"
import * as SchemaTransformation from "effect/SchemaTransformation"
import { decodeCrockfordBase32, encodeCrockfordBase32, formatHexStringAsUUIDv7 } from "./internal/UUIDv7Utils.ts"

const UUIDv7Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

export const UUIDv7 = pipe(
  S.String,
  S.decode(SchemaTransformation.toLowerCase()),
  S.check(S.isPattern(UUIDv7Regex)),
  S.brand("@one-kilo/lib/UUIDv7"),
  S.annotate({
    identifier: "UUIDv7",
    title: "UUIDv7",
    description: "A UUID version 7 (time-ordered) identifier"
  })
)
export type UUIDv7 = typeof UUIDv7.Type

const ShortenedUUIDv7Regex = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{26}$/

export const ShortenedUUIDv7 = pipe(
  S.String,
  S.decode(SchemaTransformation.toUpperCase()),
  S.check(S.isPattern(ShortenedUUIDv7Regex)),
  S.brand("@one-kilo/lib/ShortenedUUIDv7"),
  S.annotate({
    identifier: "ShortenedUUIDv7",
    title: "UUIDv7 (Shortened)",
    description: "A UUID version 7, encoded without dashes in Crockford's base32"
  })
)
export type ShortenedUUIDv7 = typeof ShortenedUUIDv7.Type

export const UUIDv7FromShortened = pipe(
  ShortenedUUIDv7,
  S.decodeTo(
    S.toType(UUIDv7),
    {
      decode: SchemaGetter.transform((shortened) =>
        pipe(
          decodeCrockfordBase32(shortened),
          Hex.encode,
          formatHexStringAsUUIDv7
        )
      ),
      encode: SchemaGetter.transformEffect((uuid) =>
        pipe(
          uuid.replace(/-/g, ""),
          Hex.decode,
          Result.match({
            onFailure: (e) => Effect.fail(new SchemaIssue.InvalidValue({ message: e.message })),
            onSuccess: (bytes) => Effect.succeed(ShortenedUUIDv7.make(encodeCrockfordBase32(bytes)))
          })
        )
      )
    }
  )
)
