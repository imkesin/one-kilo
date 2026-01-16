import * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as Config from "effect/Config"
import type { ConfigError } from "effect/ConfigError"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Redacted from "effect/Redacted"
import * as OrganizationsClientDefinitions from "./internal/Api/OrganizationsApiClientDefinitions.ts"
import * as UserManagementClientDefinitions from "./internal/Api/UserManagementApiClientDefinitions.ts"

export interface Service {
  readonly client: {
    readonly userManagement: UserManagementClientDefinitions.Client
    readonly organizations: OrganizationsClientDefinitions.Client
  }
}

export class ApiClient extends Context.Tag(
  "@effect-workos/workos/ApiClient"
)<ApiClient, Service>() {}

export const make = (
  options: {
    /**
     * The WorkOS API Key
     */
    readonly apiKey: Redacted.Redacted<string>
  }
): Effect.Effect<Service, never, HttpClient.HttpClient> =>
  Effect.gen(function*() {
    const apiPath = "https://api.workos.com"

    const baseHttpClient = yield* pipe(
      HttpClient.HttpClient,
      Effect.map(
        HttpClient.mapRequest(
          HttpClientRequest.bearerToken(options.apiKey)
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
        userManagement: UserManagementClientDefinitions.make(userManagementHttpClient),
        organizations: OrganizationsClientDefinitions.make(organizationsHttpClient)
      }
    })
  })

export const layer = (
  options: {
    readonly apiKey: Redacted.Redacted<string>
  }
): Layer.Layer<ApiClient, never, HttpClient.HttpClient> => Layer.effect(ApiClient, make(options))

export const layerConfig = (
  options: {
    readonly apiKey: Config.Config<Redacted.Redacted<string>>
  }
): Layer.Layer<ApiClient, ConfigError, HttpClient.HttpClient> => {
  return pipe(
    Config.all(options),
    Effect.flatMap((configs) => make(configs)),
    Layer.effect(ApiClient)
  )
}
