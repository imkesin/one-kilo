import { describe, expect, it } from "@effect/vitest"
import * as S from "effect/Schema"
import { LocalDate } from "../../src/values/LocalDate.ts"

describe("LocalDate", () => {
  const decode = S.decodeSync(LocalDate)

  /*
   * Temporal can silently constrains an out-of-range date (e.g. 2024-02-30 -> 2024-02-29) instead of failing.
   * We explicity set `{ overflow: "reject" }` to avoid this case.
   */
  describe("rejects pattern-valid but non-existent calendar dates", () => {
    it.each([
      { case: "invalid day-of-month", input: "2024-02-30" },
      { case: "invalid month", input: "2024-13-01" }
    ])("$case", ({ input }) => {
      expect(() => decode(input)).toThrow()
    })
  })
})
