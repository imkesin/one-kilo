import * as HttpApiEndpoint from "@effect/platform/HttpApiEndpoint"
import * as HttpApiGroup from "@effect/platform/HttpApiGroup"
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
    HttpApiEndpoint.post("exchangeCode", "/exchange-code")
      .setPayload(AuthenticationApi_ExchangeCodeSchemas.Payload)
      .addSuccess(AuthenticationApi_ExchangeCodeSchemas.Success)
      .addError(AuthenticationApi_ExchangeCode_InvalidCodeError)
  )
  .add(
    HttpApiEndpoint.post("refreshContext", "/refresh-context")
      .setPayload(AuthenticationApi_RefreshContextSchemas.Payload)
      .addSuccess(AuthenticationApi_RefreshContextSchemas.Success)
      .addError(AuthenticationApi_RefreshContext_InvalidRefreshTokenError)
  )
  .prefix("/authentication")
{}
