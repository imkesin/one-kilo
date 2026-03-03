import * as S from "effect/Schema"
import * as RandomString from "./RandomString.ts"

export const makePrefixedIdGenerator = <Brand extends string>(
  baseSchema: S.brand<typeof S.NonEmptyTrimmedString, Brand>,
  prefix: string
) =>
() => {
  const id = RandomString.generateRandomString("Id")

  // @ts-expect-error - we are not able to infer that this is a valid branded type
  return baseSchema.make(`${prefix}_${id}`)
}
