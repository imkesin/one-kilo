import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"

const FORBIDDEN_ERROR_MESSAGE = "You do not have permission to perform this action"

export class ForbiddenError extends S.TaggedError<ForbiddenError>(
  "@one-kilo/server-api/ForbiddenError"
)(
  "ForbiddenError",
  {
    message: pipe(
      S.Trimmed.check(S.isNonEmpty()),
      S.withDecodingDefault(Effect.succeed(FORBIDDEN_ERROR_MESSAGE)),
      S.withConstructorDefault(Effect.succeed(FORBIDDEN_ERROR_MESSAGE))
    )
  },
  { httpApiStatus: 403 }
) {}
