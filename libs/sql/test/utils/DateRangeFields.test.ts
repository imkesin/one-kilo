import { describe, expect, it } from "@effect/vitest"
import * as S from "effect/Schema"
import { LocalDateRangeFromPgDateRange } from "../../src/utils/DateRangeFields.ts"

describe("LocalDateRangeFromPgDateRange", () => {
  const decode = S.decodeSync(LocalDateRangeFromPgDateRange)
  const encode = S.encodeSync(LocalDateRangeFromPgDateRange)

  it("decodes a bounded range, shifting the exclusive upper to an inclusive end", () => {
    const range = decode("[2024-01-01,2025-01-01)")

    expect(range.start.toString()).toBe("2024-01-01")
    expect(range.end?.toString()).toBe("2024-12-31")
  })

  it("decodes an unbounded upper as an ongoing range (null end)", () => {
    const range = decode("[2024-01-01,)")

    expect(range.start.toString()).toBe("2024-01-01")
    expect(range.end).toBeNull()
  })

  it("round-trips back to half-open Postgres text", () => {
    expect(encode(decode("[2024-01-01,2025-01-01)"))).toBe("[2024-01-01,2025-01-01)")
    expect(encode(decode("[2024-01-01,)"))).toBe("[2024-01-01,)")
  })

  it.each([
    { case: "missing lower bound", input: "[,2025-01-01)" },
    { case: "lower bound is not a date", input: "[nope,2025-01-01)" }
  ])("rejects malformed input: $case", ({ input }) => {
    expect(() => decode(input)).toThrow()
  })
})
