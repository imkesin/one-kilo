import { AuthenticationCode, RefreshToken } from "@effect/auth-workos/domain/Values"
import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import { AuthenticationContext } from "@one-kilo/domain/values/AuthenticationContext"
import * as S from "effect/Schema"

const AuthenticationApi_ExchangeCode_Payload = S.Struct({ code: AuthenticationCode })

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
  Payload: AuthenticationApi_ExchangeCode_Payload,
  Success: AuthenticationApi_ExchangeCode_Success,
  Error: {
    InvalidCode: AuthenticationApi_ExchangeCode_InvalidCodeError
  }
} as const

const AuthenticationApi_RefreshContext_Payload = S.Struct({ refreshToken: RefreshToken })

class AuthenticationApi_RefreshContext_Success extends S.TaggedClass<AuthenticationApi_RefreshContext_Success>(
  "@one-kilo/server-api/RefreshContext:Success"
)(
  "RefreshContext:Success",
  {
    authenticationContext: AuthenticationContext
  },
  HttpApiSchema.annotations({ status: 200 })
) {}

class AuthenticationApi_RefreshContext_InvalidRefreshTokenError
  extends S.TaggedError<AuthenticationApi_RefreshContext_InvalidRefreshTokenError>(
    "@one-kilo/server-api/RefreshContext:InvalidRefreshTokenError"
  )(
    "RefreshContext:InvalidRefreshTokenError",
    {},
    HttpApiSchema.annotations({
      status: 401,
      description: "A session could not be refreshed because the provided refresh token is invalid"
    })
  )
{}

export const AuthenticationApi_RefreshContextSchemas = {
  Payload: AuthenticationApi_RefreshContext_Payload,
  Success: AuthenticationApi_RefreshContext_Success,
  Error: {
    InvalidRefreshToken: AuthenticationApi_RefreshContext_InvalidRefreshTokenError
  }
} as const
