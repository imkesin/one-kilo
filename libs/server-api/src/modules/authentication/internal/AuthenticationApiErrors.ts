import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import * as S from "effect/Schema"

export class ExchangeCode_InvalidCode_ApiError extends S.TaggedError<ExchangeCode_InvalidCode_ApiError>()(
  "ExchangeCode_InvalidCode_ApiError",
  {},
  HttpApiSchema.annotations({
    status: 401,
    description: "A session could not be created because the provided code is invalid"
  })
) {}
