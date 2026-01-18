import * as Config from "effect/Config"
import type { ConfigError } from "effect/ConfigError"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as PublicOAuth2ClientDefinitions from "./internal/PublicOAuth2/PublicOAuth2ClientDefinitions.ts"

export interface Service {
  readonly client: PublicOAuth2ClientDefinitions.Client
}

export class PublicOAuth2Client extends Context.Tag(
  "@effect-workos/workos/PublicOAuth2Client"
)<PublicOAuth2Client, Service>() {}

export const make = (
  options: {
    /**
     * The domain of the authentication server
     */
    readonly authKitDomain: string
  }
): Effect.Effect<Service> =>
  Effect.succeed(
    PublicOAuth2Client.of({
      client: PublicOAuth2ClientDefinitions.make({
        authKitPath: `https://${options.authKitDomain}`
      })
    })
  )

export const layer = (
  options: {
    readonly authKitDomain: string
  }
): Layer.Layer<PublicOAuth2Client> => Layer.effect(PublicOAuth2Client, make(options))

export const layerConfig = (
  options: {
    readonly authKitDomain: Config.Config<string>
  }
): Layer.Layer<PublicOAuth2Client, ConfigError, never> => {
  return pipe(
    Config.all(options),
    Effect.flatMap((configs) => make(configs)),
    Layer.effect(PublicOAuth2Client)
  )
}
