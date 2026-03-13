import * as HttpApiEndpoint from "@effect/platform/HttpApiEndpoint"
import * as HttpApiGroup from "@effect/platform/HttpApiGroup"
import { Authentication_ExchangeCode_ApiSchemas } from "./AuthenticationApiSchemas.ts"
import { ExchangeCode_InvalidCode_ApiError } from "./internal/AuthenticationApiErrors.ts"

export class AuthenticationApi extends HttpApiGroup.make("authentication")
  .add(
    HttpApiEndpoint.post("exchangeCode", "/exchange-code")
      .setPayload(Authentication_ExchangeCode_ApiSchemas.Payload)
      .addSuccess(Authentication_ExchangeCode_ApiSchemas.Success)
      .addError(ExchangeCode_InvalidCode_ApiError)
  )
  .prefix("/authentication")
{}
