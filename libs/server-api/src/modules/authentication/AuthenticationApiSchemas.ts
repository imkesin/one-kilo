import { AuthenticationCode, RefreshToken } from "@effect/auth-workos/domain/Values"
import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import { AuthenticationContext } from "@one-kilo/domain/values/AuthenticationContext"
import * as S from "effect/Schema"
import {
  AuthenticationApi_ExchangeCode_InvalidCodeError,
  AuthenticationApi_RefreshContext_InvalidRefreshTokenError
} from "./internal/AuthenticationApiErrors.ts"

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

export const AuthenticationApi_RefreshContextSchemas = {
  Payload: AuthenticationApi_RefreshContext_Payload,
  Success: AuthenticationApi_RefreshContext_Success,
  Error: {
    InvalidRefreshToken: AuthenticationApi_RefreshContext_InvalidRefreshTokenError
  }
} as const
