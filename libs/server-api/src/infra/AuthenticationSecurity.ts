import type { AccessToken } from "@effect/auth-workos/domain/Values"
import type { Actor } from "@one-kilo/domain/tags/Actor"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as HttpApiMiddleware from "effect/http-api/HttpApiMiddleware"
import * as HttpApiSecurity from "effect/http-api/HttpApiSecurity"
import * as S from "effect/Schema"

export class AuthenticationHeaders extends S.Class<AuthenticationHeaders>(
  "@one-kilo/server-api/AuthenticationHeaders"
)({
  authorization: S.Trimmed.check(S.isNonEmpty())
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
      S.Trimmed.check(S.isNonEmpty()),
      S.withDecodingDefault(Effect.succeed(UNAUTHENTICATED_ERROR_MESSAGE)),
      S.withConstructorDefault(Effect.succeed(UNAUTHENTICATED_ERROR_MESSAGE))
    )
  },
  { httpApiStatus: 401 }
) {}

export class AuthenticationMiddleware extends HttpApiMiddleware.Service<AuthenticationMiddleware, {
  provides: Actor
}>()(
  "@one-kilo/server-api/AuthenticationMiddleware",
  {
    error: UnauthenticatedError,
    security: {
      jwt: HttpApiSecurity.bearer
    }
  }
) {}
