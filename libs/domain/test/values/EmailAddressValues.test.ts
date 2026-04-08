import { describe, expect, it } from "@effect/vitest"
import * as S from "effect/Schema"
import { EmailAddress } from "../../src/values/EmailAddressValues.ts"

describe("EmailAddress", () => {
  const decode = S.decodeSync(EmailAddress)

  describe("successfully decodes", () => {
    it.each([
      { case: "valid email", input: "user@example.com", expected: "user@example.com" },
      { case: "mixed-case", input: "User@Example.COM", expected: "user@example.com" },
      { case: "whitespace", input: "  user@example.com  ", expected: "user@example.com" },
      { case: "mixed-case + whitespace", input: "  User@Example.COM  ", expected: "user@example.com" }
    ])("$case", ({ input, expected }) => {
      expect(decode(input)).toBe(expected)
    })
  })

  describe("rejects", () => {
    it.each([
      { case: "empty string", input: "" },
      { case: "whitespace-only", input: "   " },
      { case: "missing `@` character", input: "user.example.com" },
      { case: "missing domain", input: "user@" },
      { case: "missing TLD", input: "user@example" },
      { case: "missing local part", input: "@example.com" }
    ])("$case", ({ input }) => {
      expect(() => decode(input)).toThrow()
    })
  })
})
