import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import * as HttpMiddleware from "@effect/platform/HttpMiddleware"
import * as HttpServer from "@effect/platform/HttpServer"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { getManagedServerRuntime } from "~/infra/runtime/server/getManagedServerRuntime"
import { WebApi } from "../WebApi"

const WebApiLive = HttpApiBuilder.api(WebApi)

const middleware = HttpApiBuilder.middleware((httpApp) =>
  pipe(
    httpApp,
    HttpMiddleware.cors(),
    HttpMiddleware.logger,
    HttpMiddleware.xForwardedHeaders
  )
)

const { dispose, handler } = pipe(
  Layer.empty,
  Layer.merge(middleware),
  Layer.provideMerge(WebApiLive),
  Layer.merge(HttpServer.layerContext),
  (_) => HttpApiBuilder.toWebHandler(_, { memoMap: getManagedServerRuntime().memoMap })
)

type Handler = (req: Request) => Promise<Response>
export const GET: Handler = handler
export const POST: Handler = handler
export const PUT: Handler = handler
export const PATCH: Handler = handler
export const DELETE: Handler = handler
export const OPTIONS: Handler = handler

const shutdown = () => {
  dispose()
}
process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)
