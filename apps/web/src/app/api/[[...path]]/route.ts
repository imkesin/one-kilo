import { HttpApiBuilder, HttpMiddleware, HttpServer } from "@effect/platform"
import { Layer, pipe } from "effect"
import { getManagedServerRuntime } from "~/infra/Runtime/server/getManagedServerRuntime"
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

process.on("SIGTERM", () => {
  dispose()
})
process.on("SIGINT", () => {
  dispose()
})
