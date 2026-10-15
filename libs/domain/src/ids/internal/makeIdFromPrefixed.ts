import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as SchemaGetter from "effect/SchemaGetter"
import * as SchemaIssue from "effect/SchemaIssue"

export const makeIdFromPrefixed = <
  PrefixedA extends string,
  PrefixedI extends string,
  IdA extends string,
  IdI extends string
>(
  prefixedSchema: S.Codec<PrefixedA, PrefixedI>,
  idSchema: S.Codec<IdA, IdI>,
  options: {
    readonly prefix: string
    readonly makeId: (uuid: string) => IdA
    readonly makePrefixed: (str: string) => PrefixedA
  }
) =>
  pipe(
    S.Union([prefixedSchema, UUIDv7.ShortenedUUIDv7]),
    S.decodeTo(
      S.toType(idSchema),
      {
        decode: SchemaGetter.transformEffect((input) => {
          const unprefixedInput = input.startsWith(options.prefix)
            ? input.slice(options.prefix.length)
            : input

          return pipe(
            unprefixedInput,
            S.decodeEffect(UUIDv7.UUIDv7FromShortened),
            Effect.mapBoth({
              onFailure: (error) => new SchemaIssue.InvalidValue({ message: error.message }, input),
              onSuccess: (decoded) => options.makeId(decoded)
            })
          )
        }),
        encode: SchemaGetter.transformEffect((id) =>
          pipe(
            S.encodeUnknownEffect(UUIDv7.UUIDv7FromShortened)(id),
            Effect.mapBoth({
              onFailure: (error) => new SchemaIssue.InvalidValue({ message: error.message }, id),
              onSuccess: (encoded) => options.makePrefixed(`${options.prefix}${encoded}`)
            })
          )
        )
      }
    )
  )
