import { pipe } from "effect/Function"
import * as ParseResult from "effect/ParseResult"
import * as S from "effect/Schema"

const AlternateApostropheRegex = /[`‘’]/g
const SimpleLatinRegex = /^[\p{Script=Latin}\p{M}0-9 .,'-]+$/u

export const Name = pipe(
  S.transformOrFail(
    S.String,
    S.typeSchema(S.String),
    {
      decode: (fromA, _options, ast) => {
        const transformed = fromA
          .trim()
          .normalize()
          .replace(/\s/g, " ")
          .replace(/ +/g, " ")
          .replace(AlternateApostropheRegex, "'")

        return transformed === ""
          ? ParseResult.fail(new ParseResult.Type(ast, transformed, "Expected a nonempty string"))
          : ParseResult.succeed(transformed)
      },
      encode: ParseResult.succeed
    }
  ),
  S.pattern(SimpleLatinRegex)
)
