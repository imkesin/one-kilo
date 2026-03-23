import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"

const INVALID_CODE_ERROR_MESSAGE = "An authentication context could not be created because the provided code is invalid"

export class AuthenticationApi_ExchangeCode_InvalidCodeError
  extends S.TaggedError<AuthenticationApi_ExchangeCode_InvalidCodeError>(
    "@one-kilo/server-api/ExchangeCode:InvalidCodeError"
  )(
    "ExchangeCode:InvalidCodeError",
    {
      message: pipe(
        S.NonEmptyTrimmedString,
        S.optional,
        S.withDefaults({
          constructor: () => INVALID_CODE_ERROR_MESSAGE,
          decoding: () => INVALID_CODE_ERROR_MESSAGE
        })
      )
    },
    HttpApiSchema.annotations({ status: 401 })
  )
{}

const INVALID_REFRESH_TOKEN_ERROR_MESSAGE =
  "The authentication context could not be refreshed because the provided refresh token is invalid"

export class AuthenticationApi_RefreshContext_InvalidRefreshTokenError
  extends S.TaggedError<AuthenticationApi_RefreshContext_InvalidRefreshTokenError>(
    "@one-kilo/server-api/RefreshContext:InvalidRefreshTokenError"
  )(
    "RefreshContext:InvalidRefreshTokenError",
    {
      message: pipe(
        S.NonEmptyTrimmedString,
        S.optional,
        S.withDefaults({
          constructor: () => INVALID_REFRESH_TOKEN_ERROR_MESSAGE,
          decoding: () => INVALID_REFRESH_TOKEN_ERROR_MESSAGE
        })
      )
    },
    HttpApiSchema.annotations({ status: 401 })
  )
{}
