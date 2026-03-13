import { AuthenticationCode } from "@effect/auth-workos/domain/Values"
import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import { AuthenticationContext } from "@one-kilo/domain/values/AuthenticationContext"
import * as S from "effect/Schema"
import { ExchangeCode_InvalidCode_ApiError } from "./internal/SessionsApiErrors.ts"

const ExchangeCode_ApiPayload = S.Struct({ code: AuthenticationCode })

const ExchangeCode_ApiSuccess = S.Struct({ authenticationContext: AuthenticationContext })
  .annotations(HttpApiSchema.annotations({ status: 200 }))

export const Sessions_ExchangeCode_ApiSchemas = {
  Payload: ExchangeCode_ApiPayload,
  Success: ExchangeCode_ApiSuccess,
  InvalidCodeError: ExchangeCode_InvalidCode_ApiError
} as const
