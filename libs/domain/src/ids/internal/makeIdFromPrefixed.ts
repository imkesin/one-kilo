import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import { pipe } from "effect/Function"
import * as ParseResult from "effect/ParseResult"
import * as S from "effect/Schema"

export const makeIdFromPrefixed = <
  PrefixedA extends string,
  PrefixedI extends string,
  IdA extends string,
  IdI extends string
>(
  prefixedSchema: S.Schema<PrefixedA, PrefixedI>,
  idSchema: S.Schema<IdA, IdI>,
  options: {
    readonly prefix: string
    readonly makeId: (uuid: string) => IdA
    readonly makePrefixed: (str: string) => PrefixedA
  }
) =>
  S.transformOrFail(
    S.Union(prefixedSchema, UUIDv7.ShortenedUUIDv7),
    S.typeSchema(idSchema),
    {
      decode: (fromA, _, ast) => {
        const unprefixedInput = fromA.startsWith(options.prefix)
          ? fromA.slice(options.prefix.length)
          : fromA

        return pipe(
          unprefixedInput,
          S.decodeUnknown(UUIDv7.UUIDv7FromShortened),
          ParseResult.mapBoth({
            onFailure: (error) => new ParseResult.Type(ast, fromA, error.message),
            onSuccess: (decoded) => options.makeId(decoded)
          })
        )
      },
      encode: (toI, _, ast) =>
        pipe(
          S.encodeUnknown(UUIDv7.UUIDv7FromShortened)(toI),
          ParseResult.mapBoth({
            onFailure: (error) => new ParseResult.Type(ast, toI, error.message),
            onSuccess: (encoded) => options.makePrefixed(`${options.prefix}${encoded}`)
          })
        )
    }
  )
