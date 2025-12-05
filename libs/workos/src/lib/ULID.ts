import { pipe } from "effect/Function"
import * as S from "effect/Schema"

const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

export function generateUlid() {
  const value = pipe(
    crypto.randomUUID(),
    (uuid) => uuid.replace(/-/g, ""),
    (hex) => BigInt(`0x${hex}`)
  )

  let remaining = value

  return Array
    .from({ length: 26 })
    .map(() => {
      const value = CROCKFORD_ALPHABET[Number(remaining % 32n)]

      remaining = remaining / 32n

      return value
    })
    .reverse()
    .join("")
}

export const makePrefixedUlidGenerator = <Brand extends string>(
  baseSchema: S.brand<typeof S.NonEmptyTrimmedString, Brand>,
  prefix: string
) =>
() => {
  const ulid = generateUlid()

  // @ts-expect-error - we are not able to infer that this is a valid branded type
  return baseSchema.make(`${prefix}_${ulid}`)
}
