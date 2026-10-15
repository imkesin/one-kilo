import { identity, pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as SchemaTransformation from "effect/SchemaTransformation"

const AlternateApostropheRegex = /[`‘’]/g
const SimpleLatinRegex = /^[\p{Script=Latin}\p{M}0-9 .,'-]+$/u

export const Name = pipe(
  S.String,
  S.decode(
    SchemaTransformation.transform({
      decode: (input) =>
        input
          .trim()
          .normalize()
          .replace(/\s/g, " ")
          .replace(/ +/g, " ")
          .replace(AlternateApostropheRegex, "'"),
      encode: identity
    })
  ),
  S.check(
    S.isNonEmpty(),
    S.isPattern(SimpleLatinRegex)
  )
)
