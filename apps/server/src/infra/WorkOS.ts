import * as WorkOSApiClient from "@effect/auth-workos/ApiClient"
import * as WorkOSApiGateway from "@effect/auth-workos/ApiGateway"
import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as TokenClient from "@effect/auth-workos/TokenClient"
import * as Config from "effect/Config"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"

const clientIdConfig = pipe(
  Config.string("WORKOS_CLIENT_ID"),
  Config.map(WorkOSIds.EnvironmentClientId.make)
)

const DirectApiClientLive = WorkOSApiClient.layerConfig({
  clientId: clientIdConfig,
  clientSecret: pipe(
    Config.string("WORKOS_API_KEY"),
    (_) => Config.redacted(_)
  )
})

const GatewayApiClientLive = pipe(
  WorkOSApiGateway.layer(),
  Layer.provide(DirectApiClientLive)
)

const TokenClientLive = TokenClient.layerConfig({
  clientId: clientIdConfig
})

export const WorkOSLive = Layer.mergeAll(
  DirectApiClientLive,
  GatewayApiClientLive,
  TokenClientLive
)
