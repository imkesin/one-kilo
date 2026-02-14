import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as WorkOSPublicApiClient from "@effect/auth-workos/PublicApiClient"
import * as Config from "effect/Config"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Logger from "effect/Logger"

const layerPublicApiClient = WorkOSPublicApiClient.layerConfig({
  clientId: pipe(
    Config.string("WORKOS_CLIENT_ID"),
    Config.map(WorkOSIds.ClientId.make)
  )
})

export const serverLayer = Layer.provide(
  layerPublicApiClient,
  Logger.pretty
)
export type ServerLayerSuccess = Layer.Layer.Success<typeof serverLayer>
