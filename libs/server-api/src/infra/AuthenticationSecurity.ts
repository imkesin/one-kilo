import { AccessToken } from "@effect/auth-workos/domain/Values"
import * as HttpApiMiddleware from "@effect/platform/HttpApiMiddleware"
import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import * as HttpApiSecurity from "@effect/platform/HttpApiSecurity"
import { Actor } from "@one-kilo/domain/tags/Actor"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"

export class AuthenticationHeaders extends S.Class<AuthenticationHeaders>(
  "@one-kilo/ServerApi/AuthenticationHeaders"
)({
  authorization: S.NonEmptyTrimmedString
}) {
  static fromAccessToken(accessToken: AccessToken) {
    return AuthenticationHeaders.make({ authorization: `Bearer ${accessToken}` })
  }
}

const UNAUTHENTICATED_ERROR_MESSAGE = "Authentication is required and has failed or has not been provided"

export class UnauthenticatedError extends S.TaggedError<UnauthenticatedError>(
  "@one-kilo/server-api/UnauthenticatedError"
)(
  "UnauthenticatedError",
  {
    message: pipe(
      S.NonEmptyTrimmedString,
      S.optional,
      S.withDefaults({
        constructor: () => UNAUTHENTICATED_ERROR_MESSAGE,
        decoding: () => UNAUTHENTICATED_ERROR_MESSAGE
      })
    )
  },
  HttpApiSchema.annotations({ status: 401 })
) {}

export class AuthenticationMiddleware extends HttpApiMiddleware.Tag<AuthenticationMiddleware>()(
  "@one-kilo/server-api/AuthenticationMiddleware",
  {
    failure: UnauthenticatedError,
    provides: Actor,
    security: {
      jwt: HttpApiSecurity.bearer
    }
  }
) {}
