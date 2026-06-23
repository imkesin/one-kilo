import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"

const FORBIDDEN_ERROR_MESSAGE = "You do not have permission to perform this action"

export class ForbiddenError extends S.TaggedError<ForbiddenError>(
  "@one-kilo/server-api/ForbiddenError"
)(
  "ForbiddenError",
  {
    message: pipe(
      S.NonEmptyTrimmedString,
      S.optional,
      S.withDefaults({
        constructor: () => FORBIDDEN_ERROR_MESSAGE,
        decoding: () => FORBIDDEN_ERROR_MESSAGE
      })
    )
  },
  HttpApiSchema.annotations({ status: 403 })
) {}
