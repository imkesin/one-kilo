import * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as Config from "effect/Config"
import type { ConfigError } from "effect/ConfigError"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Redacted from "effect/Redacted"
import type { ClientId } from "./domain/Ids.ts"
import * as OrganizationsClientDefinitions from "./internal/Api/OrganizationsApiClientDefinitions.ts"
import * as UserManagementClientDefinitions from "./internal/Api/UserManagementApiClientDefinitions.ts"

export interface Service {
  readonly client: {
    readonly userManagement: UserManagementClientDefinitions.Client
    readonly organizations: OrganizationsClientDefinitions.Client
  }
}

export class ApiClient extends Context.Tag(
  "@effect/auth-workos/ApiClient"
)<ApiClient, Service>() {}

export const make = (
  options: {
    /**
     * The WorkOS Client ID
     */
    readonly clientId: ClientId
    /**
     * The WorkOS API Key
     */
    readonly clientSecret: Redacted.Redacted<string>
  }
): Effect.Effect<Service, never, HttpClient.HttpClient> =>
  Effect.gen(function*() {
    const apiPath = "https://api.workos.com"

    const baseHttpClient = yield* pipe(
      HttpClient.HttpClient,
      Effect.map(
        HttpClient.mapRequest(
          HttpClientRequest.bearerToken(options.clientSecret)
        )
      )
    )
    const userManagementHttpClient = HttpClient.mapRequest(
      baseHttpClient,
      HttpClientRequest.prependUrl(`${apiPath}/user_management`)
    )
    const organizationsHttpClient = HttpClient.mapRequest(
      baseHttpClient,
      HttpClientRequest.prependUrl(`${apiPath}/organizations`)
    )

    return ApiClient.of({
      client: {
        userManagement: UserManagementClientDefinitions.make(userManagementHttpClient, options),
        organizations: OrganizationsClientDefinitions.make(organizationsHttpClient)
      }
    })
  })

export const layer = (
  options: {
    readonly clientId: ClientId
    readonly clientSecret: Redacted.Redacted<string>
  }
): Layer.Layer<ApiClient, never, HttpClient.HttpClient> => Layer.effect(ApiClient, make(options))

export const layerConfig = (
  options: {
    readonly clientId: Config.Config<ClientId>
    readonly clientSecret: Config.Config<Redacted.Redacted<string>>
  }
): Layer.Layer<ApiClient, ConfigError, HttpClient.HttpClient> => {
  return pipe(
    Config.all(options),
    Effect.flatMap((configs) => make(configs)),
    Layer.effect(ApiClient)
  )
}
