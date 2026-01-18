import * as Config from "effect/Config"
import type { ConfigError } from "effect/ConfigError"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import type { ClientId } from "./domain/DomainIds.ts"
import * as PublicApiClientUserManagementDefinitions from "./internal/PublicApi/PublicApiClientDefinitions.ts"

export interface Service {
  readonly client: {
    readonly userManagement: PublicApiClientUserManagementDefinitions.Client
  }
}

export class PublicApiClient extends Context.Tag(
  "@effect-workos/workos/PublicApiClient"
)<PublicApiClient, Service>() {}

export const make = (
  options: {
    /**
     * The WorkOS Client ID
     */
    readonly clientId: ClientId
  }
): Effect.Effect<Service> =>
  Effect.succeed(
    PublicApiClient.of({
      client: {
        userManagement: PublicApiClientUserManagementDefinitions.make({
          apiPath: "https://api.workos.com",
          clientId: options.clientId
        })
      }
    })
  )

export const layer = (
  options: {
    readonly clientId: ClientId
  }
): Layer.Layer<PublicApiClient> => Layer.effect(PublicApiClient, make(options))

export const layerConfig = (
  options: {
    readonly clientId: Config.Config<ClientId>
  }
): Layer.Layer<PublicApiClient, ConfigError> => {
  return pipe(
    Config.all(options),
    Effect.flatMap((configs) => make(configs)),
    Layer.effect(PublicApiClient)
  )
}
