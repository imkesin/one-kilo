import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import * as NodeHttpServer from "@effect/platform-node/NodeHttpServer"
import { ServerApi } from "@one-kilo/server-api/ServerApi"
import * as TestRunner from "effect/cluster/TestRunner"
import * as Config from "effect/Config"
import type * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder"
import * as HttpMiddleware from "effect/http/HttpMiddleware"
import * as HttpRouter from "effect/http/HttpRouter"
import type * as HttpServerResponse from "effect/http/HttpServerResponse"
import * as Layer from "effect/Layer"
import { createServer } from "node:http"
import { AuthenticationMiddlewareLayer } from "./infra/AuthenticationMiddleware.ts"
import { ClusterClientLayer } from "./infra/Cluster.ts"
import { SqlLayer } from "./infra/Sql.ts"
import { WorkOSLayer } from "./infra/WorkOS.ts"
import { AthletesHttp } from "./modules/athletes/AthletesHttp.ts"
import { AuthenticationHttp } from "./modules/authentication/AuthenticationHttp.ts"
import { HealthHttp } from "./modules/health/HealthHttp.ts"
import { PersonsHttp } from "./modules/persons/PersonsHttp.ts"
import { WhoAmIHttp } from "./modules/whoami/WhoAmIHttp.ts"

const ServerApiLayer = pipe(
  HttpApiBuilder.layer(ServerApi),
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
  Layer.merge(ClusterClientLayer, WorkOSLayer),
  Layer.provideMerge(SqlLayer),
  Layer.provide(NodeHttpClient.layerUndici)
)

/*
 * The logger is applied manually so that it runs inside `xForwardedHeaders` and records the forwarded address.
 */
const middleware = <E, R>(httpApp: Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>) =>
  pipe(
    httpApp,
    HttpMiddleware.logger,
    HttpMiddleware.xForwardedHeaders
  )

export const HttpTestWithoutInfra = pipe(
  HttpRouter.serve(ServerApiLayer, { middleware, disableLogger: true, disableListenLog: true }),
  Layer.provide(TestRunner.layer),
  Layer.provideMerge(NodeHttpServer.layerTest)
)

export const HttpLayer = pipe(
  HttpRouter.serve(ServerApiLayer, { middleware, disableLogger: true }),
  Layer.provide(ServerInfraLayer),
  Layer.provide(
    NodeHttpServer.layerConfig(
      createServer,
      {
        port: pipe(
          Config.Number("PORT"),
          Config.withDefault(10000)
        )
      }
    )
  )
)
