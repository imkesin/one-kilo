import * as WorkOSApiClient from "@effect/auth-workos/ApiClient"
import * as WorkOSApiGateway from "@effect/auth-workos/ApiGateway"
import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as TokenClient from "@effect/auth-workos/TokenClient"
import * as Config from "effect/Config"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"

const clientIdConfig = pipe(
  Config.String("WORKOS_CLIENT_ID"),
  Config.map(WorkOSIds.EnvironmentClientId.make)
)

const DirectApiClientLayer = WorkOSApiClient.layerConfig({
  clientId: clientIdConfig,
  clientSecret: Config.Redacted("WORKOS_API_KEY")
})

const GatewayApiClientLayer = pipe(
  WorkOSApiGateway.layer,
  Layer.provide(DirectApiClientLayer)
)

const TokenClientLayer = TokenClient.layerConfig({
  clientId: clientIdConfig
})

export const WorkOSLayer = Layer.mergeAll(
  DirectApiClientLayer,
  GatewayApiClientLayer,
  TokenClientLayer
)
