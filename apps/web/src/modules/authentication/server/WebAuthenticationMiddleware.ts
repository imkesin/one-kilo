import { dieWithUnexpectedErrorCallback } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { WebActor } from "~/infra/api/WebActor"
import { WebUnauthenticatedError } from "~/infra/api/WebApiErrors"
import { WebAuthenticationMiddleware } from "~/infra/api/WebAuthenticationSecurity"
import { AuthenticationWebModule } from "./AuthenticationWebModule.ts"

export const WebAuthenticationMiddlewareLayer = pipe(
  Layer.effect(
    WebAuthenticationMiddleware,
    Effect.gen(function*() {
      const authentication = yield* AuthenticationWebModule

      const webActor = pipe(
        authentication.refreshedAuthenticationContext,
        Effect.map(({ workosAccessToken }) => WebActor.of({ workosAccessToken })),
        Effect.catchTags({
          "AuthenticationContextCookieNotFoundError": () => WebUnauthenticatedError.make(),
          "RefreshContext:InvalidRefreshTokenError": () => WebUnauthenticatedError.make()
        }),
        Effect.catchIf(
          (error) => !(error instanceof WebUnauthenticatedError),
          dieWithUnexpectedErrorCallback("An unexpected error occurred")
        )
      )

      return WebAuthenticationMiddleware.of((httpEffect) => Effect.provideServiceEffect(httpEffect, WebActor, webActor))
    })
  ),
  Layer.provide(AuthenticationWebModule.layer)
)
