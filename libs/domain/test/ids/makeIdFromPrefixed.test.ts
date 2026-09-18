import { describe, it } from "@effect/vitest"
import * as S from "effect/Schema"
import { expect } from "vitest"
import { AccountIdFromPrefixed } from "../../src/ids/AccountId.ts"

const FULL = "019c1144-15bd-7eff-a88d-37439858704e"
const SHORTENED = "06E12H0NQNZFZA4D6X1SGP3G9R"
const PREFIXED = `account_${SHORTENED}`

describe("makeIdFromPrefixed (decode)", () => {
  const decode = S.decodeSync(AccountIdFromPrefixed)

  it("decodes a prefixed shortened id", () => {
    expect(decode(PREFIXED)).toBe(FULL)
  })

  it("decodes an unprefixed (bare) shortened id", () => {
    expect(decode(SHORTENED)).toBe(FULL)
  })

  it("normalizes a lowercase bare shortened id", () => {
    expect(decode(SHORTENED.toLowerCase())).toBe(FULL)
  })

  it("rejects a foreign prefix", () => {
    expect(() => decode(`coach_${SHORTENED}`)).toThrow()
  })

  it("encodes back to the prefixed form", () => {
    expect(S.encodeSync(AccountIdFromPrefixed)(decode(PREFIXED))).toBe(PREFIXED)
  })
})
