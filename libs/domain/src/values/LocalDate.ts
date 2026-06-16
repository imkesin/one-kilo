import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as ParseResult from "effect/ParseResult"
import * as S from "effect/Schema"

/**
 * A validated ISO-8601 `YYYY-MM-DD` string
 */
const LocalDateString = pipe(
  S.NonEmptyTrimmedString,
  S.pattern(/^\d{4}-\d{2}-\d{2}$/),
  S.brand("@one-kilo/domain/LocalDateString")
)

export const LocalDate = pipe(
  LocalDateString,
  S.transformOrFail(
    S.instanceOf(Temporal.PlainDate),
    {
      decode: (isoString, _options, ast) =>
        Effect.try({
          try: () => Temporal.PlainDate.from(isoString, { overflow: "reject" }),
          catch: (error) =>
            new ParseResult.Type(
              ast,
              isoString,
              error instanceof Error ? error.message : String(error)
            )
        }),
      encode: (plainDate) =>
        pipe(
          plainDate.toString(),
          LocalDateString.make,
          ParseResult.succeed
        )
    }
  ),
  S.annotations({
    description: "A calendar date (no time component)",
    identifier: "LocalDate",
    title: "Local Date"
  })
)
export type LocalDate = typeof LocalDate.Type
