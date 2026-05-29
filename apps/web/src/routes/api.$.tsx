import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import * as HttpMiddleware from "@effect/platform/HttpMiddleware"
import * as HttpServer from "@effect/platform/HttpServer"
import { createFileRoute } from "@tanstack/react-router"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { WebApi } from "~/infra/api/WebApi"
import { getManagedWebServerRuntime } from "~/infra/runtime/server/getManagedServerRuntime"

const WebApiLive = HttpApiBuilder.api(WebApi)

const middleware = HttpApiBuilder.middleware((httpApp) =>
  pipe(
    httpApp,
    HttpMiddleware.cors(),
    HttpMiddleware.logger,
    HttpMiddleware.xForwardedHeaders
  )
)

const { handler } = pipe(
  Layer.empty,
  Layer.merge(middleware),
  Layer.provideMerge(WebApiLive),
  Layer.merge(HttpServer.layerContext),
  (_) => HttpApiBuilder.toWebHandler(_, { memoMap: getManagedWebServerRuntime().memoMap })
)

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
