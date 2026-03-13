import { NodeHttpClient, NodeHttpServer } from "@effect/platform-node"
import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import type * as HttpApp from "@effect/platform/HttpApp"
import * as HttpMiddleware from "@effect/platform/HttpMiddleware"
import * as HttpServer from "@effect/platform/HttpServer"
import { ServerApi } from "@one-kilo/server-api/ServerApi"
import * as Config from "effect/Config"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { createServer } from "node:http"
import { SqlLive } from "./infra/Sql.ts"
import { ApiGatewayAndDirectClientLive } from "./infra/WorkOS.ts"
import { AuthenticationHttp } from "./modules/authentication/AuthenticationHttp.ts"
import { HealthHttp } from "./modules/health/HealthHttp.ts"

const ServerApiLive = pipe(
  HttpApiBuilder.api(ServerApi),
  Layer.provide([
    AuthenticationHttp,
    HealthHttp
  ]),
  Layer.provide([
    ApiGatewayAndDirectClientLive,
    SqlLive
  ]),
  Layer.provide(NodeHttpClient.layerUndici)
)

const middleware = (httpApp: HttpApp.Default) =>
  pipe(
    httpApp,
    HttpMiddleware.logger,
    HttpMiddleware.xForwardedHeaders
  )

export const HttpTest = HttpApiBuilder
  .serve(middleware)
  .pipe(
    Layer.provide(ServerApiLive),
    Layer.provideMerge(NodeHttpServer.layerTest)
  )

export const HttpLive = HttpApiBuilder
  .serve(middleware)
  .pipe(
    HttpServer.withLogAddress,
    Layer.provide(ServerApiLive),
    Layer.provide(
      NodeHttpServer.layerConfig(
        createServer,
        {
          port: pipe(
            Config.number("PORT"),
            Config.withDefault(10_000)
          )
        }
      )
    )
  )
