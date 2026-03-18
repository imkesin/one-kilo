import * as HttpApiEndpoint from "@effect/platform/HttpApiEndpoint"
import * as HttpApiGroup from "@effect/platform/HttpApiGroup"
import { AuthenticationApi_ExchangeCodeSchemas } from "./AuthenticationApiSchemas.ts"
import { AuthenticationApi_ExchangeCode_InvalidCodeError } from "./internal/AuthenticationApiErrors.ts"

export class AuthenticationApi extends HttpApiGroup.make("authentication")
  .add(
    HttpApiEndpoint.post("exchangeCode", "/exchange-code")
      .setPayload(AuthenticationApi_ExchangeCodeSchemas.Payload)
      .addSuccess(AuthenticationApi_ExchangeCodeSchemas.Success)
      .addError(AuthenticationApi_ExchangeCode_InvalidCodeError)
  )
  .prefix("/authentication")
{}
