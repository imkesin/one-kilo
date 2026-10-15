import { createFileRoute } from "@tanstack/react-router"
import type * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder"
import * as HttpMiddleware from "effect/http/HttpMiddleware"
import * as HttpRouter from "effect/http/HttpRouter"
import * as HttpServer from "effect/http/HttpServer"
import type * as HttpServerResponse from "effect/http/HttpServerResponse"
import * as Layer from "effect/Layer"
import { WebApi } from "~/infra/api/WebApi"
import { getManagedWebServerRuntime } from "~/infra/runtime/server/getManagedServerRuntime"
import { WebAuthenticationMiddlewareLayer } from "~/modules/authentication/server/WebAuthenticationMiddleware"
import { WhoAmIWebHttp } from "~/modules/whoami/api/WhoAmIWebHttp"

const WebApiLayer = pipe(
  HttpApiBuilder.layer(WebApi),
  Layer.provide([WhoAmIWebHttp]),
  Layer.provide(WebAuthenticationMiddlewareLayer),
  Layer.provide(HttpServer.layerServices)
)

/*
 * The logger is applied manually so that it runs inside `xForwardedHeaders` and records the forwarded address.
 */
const middleware = <E, R>(httpApp: Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>) =>
  pipe(
    httpApp,
    HttpMiddleware.cors(),
    HttpMiddleware.logger,
    HttpMiddleware.xForwardedHeaders
  )

const { handler } = HttpRouter.toWebHandler(WebApiLayer, {
  memoMap: getManagedWebServerRuntime().memoMap,
  middleware,
  disableLogger: true
})

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: ({ request }) => handler(request),
      POST: ({ request }) => handler(request),
      PUT: ({ request }) => handler(request),
      PATCH: ({ request }) => handler(request),
      DELETE: ({ request }) => handler(request),
      OPTIONS: ({ request }) => handler(request)
    }
  }
})
