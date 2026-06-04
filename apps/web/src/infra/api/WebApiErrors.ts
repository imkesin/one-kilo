import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"

const UNAUTHENTICATED_ERROR_MESSAGE = "Authentication is required and has failed or has not been provided"

export class WebUnauthenticatedError extends S.TaggedError<WebUnauthenticatedError>(
  "@one-kilo/web/WebUnauthenticatedError"
)(
  "WebUnauthenticatedError",
  {
    message: pipe(
      S.NonEmptyTrimmedString,
      S.optional,
      S.withDefaults({
        constructor: () => UNAUTHENTICATED_ERROR_MESSAGE,
        decoding: () => UNAUTHENTICATED_ERROR_MESSAGE
      })
    )
  },
  HttpApiSchema.annotations({ status: 401 })
) {}
