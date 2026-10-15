import type * as S from "effect/Schema"
import * as RandomString from "./RandomString.ts"

export const makePrefixedIdGenerator = <Brand extends string>(
  baseSchema: S.brand<S.Trimmed, Brand>,
  prefix: string
) =>
() => {
  const id = RandomString.generateRandomString("Id")

  return baseSchema.make(`${prefix}_${id}`)
}
