import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"

const UNAUTHENTICATED_ERROR_MESSAGE = "Authentication is required and has failed or has not been provided"

export class WebUnauthenticatedError extends S.TaggedError<WebUnauthenticatedError>(
  "@one-kilo/web/WebUnauthenticatedError"
)(
  "WebUnauthenticatedError",
  {
    message: pipe(
      S.Trimmed.check(S.isNonEmpty()),
      S.withDecodingDefault(Effect.succeed(UNAUTHENTICATED_ERROR_MESSAGE)),
      S.withConstructorDefault(Effect.succeed(UNAUTHENTICATED_ERROR_MESSAGE))
    )
  },
  { httpApiStatus: 401 }
) {}
