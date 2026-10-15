import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as SchemaIssue from "effect/SchemaIssue"
import * as SchemaTransformation from "effect/SchemaTransformation"

/**
 * A validated ISO-8601 `YYYY-MM-DD` string
 */
const LocalDateString = pipe(
  S.Trimmed.check(S.isNonEmpty()),
  S.check(S.isPattern(/^\d{4}-\d{2}-\d{2}$/)),
  S.brand("@one-kilo/domain/LocalDateString")
)

export const LocalDate = pipe(
  LocalDateString,
  S.decodeTo(
    S.instanceOf(Temporal.PlainDate),
    SchemaTransformation.transformEffect({
      decode: (isoString) =>
        Effect.try({
          try: () => Temporal.PlainDate.from(isoString, { overflow: "reject" }),
          catch: (error) =>
            new SchemaIssue.InvalidValue(
              { message: error instanceof Error ? error.message : String(error) },
              isoString
            )
        }),
      encode: (plainDate) =>
        pipe(
          plainDate.toString(),
          LocalDateString.make,
          Effect.succeed
        )
    })
  ),
  S.annotate({
    description: "A calendar date (no time component)",
    identifier: "LocalDate",
    title: "Local Date"
  })
)
export type LocalDate = typeof LocalDate.Type
