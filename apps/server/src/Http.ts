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
import { AuthenticationMiddlewareLive } from "./infra/AuthenticationMiddleware.ts"
import { WorkflowEngineLive } from "./infra/Cluster.ts"
import { SqlLive } from "./infra/Sql.ts"
import { WorkOSLive } from "./infra/WorkOS.ts"
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
  Layer.provide(AuthenticationMiddlewareLive)
)

const ServerInfraLive = pipe(
  Layer.merge(WorkflowEngineLive, WorkOSLive),
  Layer.provideMerge(SqlLive),
  Layer.provide(NodeHttpClient.layerUndici)
)

const middleware = (httpApp: HttpApp.Default) =>
  pipe(
    httpApp,
    HttpMiddleware.logger,
    HttpMiddleware.xForwardedHeaders
  )

export const HttpTestWithoutInfra = pipe(
  HttpApiBuilder.serve(middleware),
  Layer.provide(ServerApiLive),
  Layer.provideMerge(NodeHttpServer.layerTest)
)

export const HttpLive = pipe(
  HttpApiBuilder.serve(middleware),
  HttpServer.withLogAddress,
  Layer.provide(ServerApiLive),
  Layer.provide(ServerInfraLive),
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
