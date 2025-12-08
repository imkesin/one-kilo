import { ClientId } from "@effect-workos/workos/domain/DomainIds"
import * as WorkOSPublicApiClient from "@effect-workos/workos/PublicApiClient"
import { Config, Layer, Logger, pipe } from "effect"

const layerPublicApiClient = WorkOSPublicApiClient.layerConfig({
  clientId: pipe(
    Config.string("WORKOS_CLIENT_ID"),
    Config.map(ClientId.make)
  )
})

export const serverLayer = Layer.provide(
  layerPublicApiClient,
  Logger.pretty
)
export type ServerLayerSuccess = Layer.Layer.Success<typeof serverLayer>
