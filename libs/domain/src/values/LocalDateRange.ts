import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { LocalDate } from "./LocalDate.ts"

/**
 * Inclusive on both bounds: [start, end], `end === null` means the range is ongoing.
 */
export const LocalDateRange = pipe(
  S.Struct({
    start: LocalDate,
    end: S.NullOr(LocalDate)
  }),
  S.filter((range) => range.end === null || Temporal.PlainDate.compare(range.start, range.end) <= 0),
  S.annotations({
    description: "A calendar date range, inclusive of both `start` and `end`. A null `end` means ongoing.",
    identifier: "LocalDateRange",
    title: "Local Date Range"
  })
)
export type LocalDateRange = typeof LocalDateRange.Type
