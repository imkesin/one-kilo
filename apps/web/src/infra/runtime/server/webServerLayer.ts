import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as WorkOSPublicApiClient from "@effect/auth-workos/PublicApiClient"
import * as Config from "effect/Config"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Logger from "effect/Logger"
import { AuthenticationWebModule } from "~/modules/authentication/server/AuthenticationWebModule"
import { WhoAmIWebProxy } from "~/modules/whoami/server/WhoAmIWebProxy"

const WebModulesLayer = Layer.mergeAll(
  AuthenticationWebModule.Default,
  WhoAmIWebProxy.Default
)

const WorkOSPublicApiClientLayer = WorkOSPublicApiClient.layerConfig({
  clientId: pipe(
    Config.string("WORKOS_CLIENT_ID"),
    Config.map(WorkOSIds.EnvironmentClientId.make)
  )
})

export const WebServerLayer = pipe(
  Layer.empty,
  Layer.merge(WebModulesLayer),
  Layer.merge(WorkOSPublicApiClientLayer),
  Layer.provide(Logger.pretty)
)

export type WebServerLayerSuccess = Layer.Layer.Success<typeof WebServerLayer>
