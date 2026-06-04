import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { WebActor } from "~/infra/api/WebActor"
import { WebUnauthenticatedError } from "~/infra/api/WebApiErrors"
import { WebAuthenticationMiddleware } from "~/infra/api/WebAuthenticationMiddleware"
import { AuthenticationWebModule } from "./AuthenticationWebModule"

export const WebAuthenticationMiddlewareLive = pipe(
  Layer.effect(
    WebAuthenticationMiddleware,
    Effect.gen(function*() {
      const authentication = yield* AuthenticationWebModule

      return WebAuthenticationMiddleware.of(
        pipe(
          authentication.refreshedAuthenticationContext,
          Effect.map(({ workosAccessToken }) => WebActor.of({ workosAccessToken })),
          Effect.catchTags({
            "AuthenticationContextCookieNotFoundError": () => WebUnauthenticatedError.make(),
            "RefreshContext:InvalidRefreshTokenError": () => WebUnauthenticatedError.make()
          }),
          orDieWithUnexpectedError("An unexpected error occurred")
        )
      )
    })
  ),
  Layer.provide(AuthenticationWebModule.Default)
)
