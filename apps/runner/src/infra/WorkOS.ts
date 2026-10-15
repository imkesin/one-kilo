import * as WorkOSApiClient from "@effect/auth-workos/ApiClient"
import * as WorkOSApiGateway from "@effect/auth-workos/ApiGateway"
import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as Config from "effect/Config"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"

const DirectApiClientLayer = WorkOSApiClient.layerConfig({
  clientId: pipe(
    Config.String("WORKOS_CLIENT_ID"),
    Config.map(WorkOSIds.EnvironmentClientId.make)
  ),
  clientSecret: Config.Redacted("WORKOS_API_KEY")
})

export const WorkOSLayer = pipe(
  WorkOSApiGateway.layer,
  Layer.provide(DirectApiClientLayer)
)
