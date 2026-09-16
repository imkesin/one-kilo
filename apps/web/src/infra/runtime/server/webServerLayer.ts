import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as WorkOSPublicApiClient from "@effect/auth-workos/PublicApiClient"
import * as Config from "effect/Config"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Logger from "effect/Logger"
import { AccountsWebProxy } from "~/modules/accounts/server/AccountsWebProxy"
import { AuthenticationWebModule } from "~/modules/authentication/server/AuthenticationWebModule"

const WebModulesLive = Layer.mergeAll(
  AuthenticationWebModule.Default,
  AccountsWebProxy.Default
)

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
