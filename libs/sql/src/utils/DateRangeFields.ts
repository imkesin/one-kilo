import { LocalDateRange } from "@one-kilo/domain/values/LocalDateRange"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as SchemaIssue from "effect/SchemaIssue"
import * as SchemaTransformation from "effect/SchemaTransformation"

/**
 * Maps a Postgres `DATERANGE` (canonically `[inclusive-lower, exclusive-upper)`) to a
 * `LocalDateRange`, which is inclusive on both bounds. A `null`/unbounded upper means ongoing.
 */
export const LocalDateRangeFromPgDateRange = pipe(
  S.Trimmed.check(S.isNonEmpty()),
  S.decodeTo(
    S.toType(LocalDateRange),
    SchemaTransformation.transformEffect({
      decode: (text) =>
        /*
         * Effect.try` because `Temporal.PlainDate.from` throws `RangeError` on malformed input
         */
        Effect.try({
          try: () => {
            const [lowerRaw, upperRaw] = text.slice(1, -1).split(",")
            if (lowerRaw === undefined || lowerRaw === "" || upperRaw === undefined) {
              throw new Error(`Malformed Postgres daterange: ${text}`)
            }

            const start = Temporal.PlainDate.from(lowerRaw, { overflow: "reject" })
            const end = upperRaw === ""
              ? null
              : Temporal.PlainDate.from(upperRaw, { overflow: "reject" }).subtract({ days: 1 })

            return { start, end }
          },
          catch: (error) =>
            new SchemaIssue.InvalidValue(
              { message: error instanceof Error ? error.message : String(error) },
              text
            )
        }),
      encode: ({ end, start }) =>
        Effect.succeed(
          `[${start.toString()},${end === null ? "" : end.add({ days: 1 }).toString()})`
        )
    })
  )
)
