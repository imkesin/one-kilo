import * as WorkOSApiClient from "@effect/auth-workos/ApiClient"
import * as WorkOSApiGateway from "@effect/auth-workos/ApiGateway"
import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as Config from "effect/Config"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"

const DirectApiClientLive = WorkOSApiClient.layerConfig({
  clientId: pipe(
    Config.string("WORKOS_CLIENT_ID"),
    Config.map(WorkOSIds.EnvironmentClientId.make)
  ),
  clientSecret: pipe(
    Config.string("WORKOS_API_KEY"),
    (_) => Config.redacted(_)
  )
})

export const ApiGatewayAndDirectClientLive = pipe(
  WorkOSApiGateway.layer(),
  Layer.provideMerge(DirectApiClientLive)
)
