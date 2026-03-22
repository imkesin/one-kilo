import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as WorkOSPublicApiClient from "@effect/auth-workos/PublicApiClient"
import * as Config from "effect/Config"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Logger from "effect/Logger"
import { AuthenticationWebModule } from "~/modules/authentication/server/AuthenticationWebModule"

const WebModulesLive = AuthenticationWebModule.Default

const WorkOSPublicApiClientLive = WorkOSPublicApiClient.layerConfig({
  clientId: pipe(
    Config.string("WORKOS_CLIENT_ID"),
    Config.map(WorkOSIds.EnvironmentClientId.make)
  )
})

export const WebServerLive = pipe(
  Layer.empty,
  Layer.merge(WebModulesLive),
  Layer.merge(WorkOSPublicApiClientLive),
  Layer.provide(Logger.pretty)
)

export type WebServerLayerSuccess = Layer.Layer.Success<typeof WebServerLive>
