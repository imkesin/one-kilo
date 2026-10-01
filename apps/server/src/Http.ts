import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import * as NodeHttpServer from "@effect/platform-node/NodeHttpServer"
import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import type * as HttpApp from "@effect/platform/HttpApp"
import * as HttpMiddleware from "@effect/platform/HttpMiddleware"
import * as HttpServer from "@effect/platform/HttpServer"
import * as WorkflowEngine from "@effect/workflow/WorkflowEngine"
import { ServerApi } from "@one-kilo/server-api/ServerApi"
import * as Config from "effect/Config"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { createServer } from "node:http"
import { AuthenticationMiddlewareLayer } from "./infra/AuthenticationMiddleware.ts"
import { WorkflowEngineLayer } from "./infra/Cluster.ts"
import { SqlLayer } from "./infra/Sql.ts"
import { WorkOSLayer } from "./infra/WorkOS.ts"
import { AthletesHttp } from "./modules/athletes/AthletesHttp.ts"
import { AuthenticationHttp } from "./modules/authentication/AuthenticationHttp.ts"
import { HealthHttp } from "./modules/health/HealthHttp.ts"
import { PersonsHttp } from "./modules/persons/PersonsHttp.ts"
import { WhoAmIHttp } from "./modules/whoami/WhoAmIHttp.ts"

const ServerApiLayer = pipe(
  HttpApiBuilder.api(ServerApi),
  Layer.provide([
    AthletesHttp,
    AuthenticationHttp,
    HealthHttp,
    PersonsHttp,
    WhoAmIHttp
  ]),
  Layer.provide(AuthenticationMiddlewareLayer)
)

const ServerInfraLayer = pipe(
  Layer.merge(WorkflowEngineLayer, WorkOSLayer),
  Layer.provideMerge(SqlLayer),
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
  Layer.provide(ServerApiLayer),
  Layer.provide(WorkflowEngine.layerMemory),
  Layer.provideMerge(NodeHttpServer.layerTest)
)

export const HttpLayer = pipe(
  HttpApiBuilder.serve(middleware),
  HttpServer.withLogAddress,
  Layer.provide(ServerApiLayer),
  Layer.provide(ServerInfraLayer),
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
