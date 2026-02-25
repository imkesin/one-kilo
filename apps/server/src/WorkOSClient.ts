import * as ApiClient from "@effect/auth-workos/ApiClient"
import * as ApiGateway from "@effect/auth-workos/ApiGateway"
import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { NodeHttpClient } from "@effect/platform-node"
import * as Config from "effect/Config"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"

const apiClientLayer = ApiClient.layerConfig({
  clientId: pipe(
    Config.string("WORKOS_CLIENT_ID"),
    Config.map(WorkOSIds.EnvironmentClientId.make)
  ),
  clientSecret: pipe(
    Config.string("WORKOS_API_KEY"),
    (_) => Config.redacted(_)
  )
})

export const WorkOSApiGatewayLive = pipe(
  ApiGateway.layer(),
  Layer.provide(apiClientLayer),
  Layer.provide(NodeHttpClient.layer)
)
