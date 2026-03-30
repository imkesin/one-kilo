import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import * as NodeHttpServer from "@effect/platform-node/NodeHttpServer"
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
import { WorkOSApiGatewayAndDirectClientLive } from "./infra/WorkOS.ts"
import { AuthenticationHttp } from "./modules/authentication/AuthenticationHttp.ts"
import { HealthHttp } from "./modules/health/HealthHttp.ts"
import { UsersHttp } from "./modules/users/UsersHttp.ts"

const ServerApiLive = pipe(
  HttpApiBuilder.api(ServerApi),
  Layer.provide([
    AuthenticationHttp,
    HealthHttp,
    UsersHttp
  ]),
  Layer.provide([
    WorkOSApiGatewayAndDirectClientLive,
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
            Config.withDefault(10000)
          )
        }
      )
    )
  )
