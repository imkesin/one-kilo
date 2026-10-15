import * as Config from "effect/Config"
import type { ConfigError } from "effect/Config"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as HttpClient from "effect/http/HttpClient"
import * as HttpClientRequest from "effect/http/HttpClientRequest"
import * as Layer from "effect/Layer"
import * as OAuth2ClientDefinitions from "./internal/oauth2/OAuth2ClientDefinitions.ts"

export type Service = OAuth2ClientDefinitions.Client

export class OAuth2Client extends Context.Service<OAuth2Client, Service>()(
  "@effect/auth-workos/OAuth2Client"
) {}

export const make = (
  options: {
    /**
     * The domain of the authentication server
     */
    readonly authKitDomain: string
  }
): Effect.Effect<Service, never, HttpClient.HttpClient> =>
  Effect.gen(function*() {
    const authKitBaseURL = `https://${options.authKitDomain}`

    const httpClient = yield* pipe(
      HttpClient.HttpClient,
      Effect.map(
        HttpClient.mapRequest(
          HttpClientRequest.prependUrl(authKitBaseURL)
        )
      )
    )

    return OAuth2Client.of(OAuth2ClientDefinitions.make(httpClient))
  })

export const layer = (
  options: {
    readonly authKitDomain: string
  }
): Layer.Layer<OAuth2Client, never, HttpClient.HttpClient> => Layer.effect(OAuth2Client, make(options))

export const layerConfig = (
  options: {
    readonly authKitDomain: Config.Config<string>
  }
): Layer.Layer<OAuth2Client, ConfigError, HttpClient.HttpClient> => {
  return pipe(
    Config.all(options),
    Effect.flatMap((configs) => make(configs)),
    Layer.effect(OAuth2Client)
  )
}
