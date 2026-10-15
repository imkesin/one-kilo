import { LocalDate } from "@one-kilo/domain/values/LocalDate"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as SchemaIssue from "effect/SchemaIssue"
import * as SchemaTransformation from "effect/SchemaTransformation"

/**
 * Maps a Postgres `DATE` (text form `YYYY-MM-DD`) to a `LocalDate`, a calendar date with no time
 * or zone. The Postgres client decodes `DATE` columns to the same text form used inside
 * `JSONB_BUILD_OBJECT`, so one representation covers both.
 */
export const LocalDateFromPgDate = pipe(
  S.Trimmed.check(S.isNonEmpty()),
  S.decodeTo(
    S.toType(LocalDate),
    SchemaTransformation.transformEffect({
      /*
       * `Effect.try` because `Temporal.PlainDate.from` throws `RangeError` on malformed input
       */
      decode: (text) =>
        Effect.try({
          try: () => Temporal.PlainDate.from(text, { overflow: "reject" }),
          catch: (error) =>
            new SchemaIssue.InvalidValue(
              { message: error instanceof Error ? error.message : String(error) },
              text
            )
        }),
      encode: (plainDate) => Effect.succeed(plainDate.toString())
    })
  )
)
