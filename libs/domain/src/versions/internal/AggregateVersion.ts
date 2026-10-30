import * as S from "effect/Schema"

/**
 * Starts at 1 on insert and increases by exactly 1 with every committed change to the row.
 */
export const AggregateVersion = S.Int.check(S.isGreaterThanOrEqualTo(1))
