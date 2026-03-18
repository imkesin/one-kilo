import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import * as S from "effect/Schema"

export class AuthenticationApi_ExchangeCode_InvalidCodeError
  extends S.TaggedError<AuthenticationApi_ExchangeCode_InvalidCodeError>(
    "@one-kilo/server-api/ExchangeCode:InvalidCodeError"
  )(
    "ExchangeCode:InvalidCodeError",
    {},
    HttpApiSchema.annotations({
      status: 401,
      description: "A session could not be created because the provided code is invalid"
    })
  )
{}
