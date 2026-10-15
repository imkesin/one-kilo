import * as HttpApiEndpoint from "effect/http-api/HttpApiEndpoint"
import * as HttpApiGroup from "effect/http-api/HttpApiGroup"
import {
  AuthenticationApi_ExchangeCodeSchemas,
  AuthenticationApi_RefreshContextSchemas
} from "./AuthenticationApiSchemas.ts"
import {
  AuthenticationApi_ExchangeCode_InvalidCodeError,
  AuthenticationApi_RefreshContext_InvalidRefreshTokenError
} from "./internal/AuthenticationApiErrors.ts"

export class AuthenticationApi extends HttpApiGroup.make("authentication")
  .add(
    HttpApiEndpoint.post("exchangeCode", "/exchange-code", {
      payload: AuthenticationApi_ExchangeCodeSchemas.Payload,
      success: AuthenticationApi_ExchangeCodeSchemas.Success,
      error: AuthenticationApi_ExchangeCode_InvalidCodeError
    }),
    HttpApiEndpoint.post("refreshContext", "/refresh-context", {
      payload: AuthenticationApi_RefreshContextSchemas.Payload,
      success: AuthenticationApi_RefreshContextSchemas.Success,
      error: AuthenticationApi_RefreshContext_InvalidRefreshTokenError
    })
  )
  .prefix("/authentication")
{}
