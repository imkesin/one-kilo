import { LocalDate } from "@one-kilo/domain/values/LocalDate"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as ParseResult from "effect/ParseResult"
import * as S from "effect/Schema"

/**
 * Maps a Postgres `DATE` (text form `YYYY-MM-DD`) to a `LocalDate`, a calendar date with no time
 * or zone. Postgres returns `DATE` columns verbatim as text, so the same representation is used
 * whether the column is read directly or via `JSONB_BUILD_OBJECT`.
 */
export const LocalDateFromPgDate = pipe(
  S.NonEmptyTrimmedString,
  S.transformOrFail(
    S.typeSchema(LocalDate),
    {
      /*
       * `Effect.try` because `Temporal.PlainDate.from` throws `RangeError` on malformed input
       */
      decode: (text, _options, ast) =>
        Effect.try({
          try: () => Temporal.PlainDate.from(text, { overflow: "reject" }),
          catch: (error) =>
            new ParseResult.Type(
              ast,
              text,
              error instanceof Error ? error.message : String(error)
            )
        }),
      encode: (plainDate) => ParseResult.succeed(plainDate.toString())
    }
  )
)
