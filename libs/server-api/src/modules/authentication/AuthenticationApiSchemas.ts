import { AuthenticationCode } from "@effect/auth-workos/domain/Values"
import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import { AuthenticationContext } from "@one-kilo/domain/values/AuthenticationContext"
import * as S from "effect/Schema"

const ExchangeCode_Api_Payload = S.Struct({ code: AuthenticationCode })

class AuthenticationApi_ExchangeCode_Success extends S.TaggedClass<AuthenticationApi_ExchangeCode_Success>(
  "@one-kilo/server-api/ExchangeCode:Success"
)(
  "ExchangeCode:Success",
  {
    authenticationContext: AuthenticationContext
  },
  HttpApiSchema.annotations({ status: 200 })
) {}

class AuthenticationApi_ExchangeCode_InvalidCodeError
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

export const AuthenticationApi_ExchangeCodeSchemas = {
  Payload: ExchangeCode_Api_Payload,
  Success: AuthenticationApi_ExchangeCode_Success,
  Error: {
    InvalidCode: AuthenticationApi_ExchangeCode_InvalidCodeError
  }
} as const
