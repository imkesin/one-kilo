import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as StoreDefinitions from "./internal/StoreDefinitions.ts"
import * as OAuth2Client from "./OAuth2Client.ts"
import * as Store from "./Store.ts"

export interface Service {
  readonly client: StoreDefinitions.OAuth2Client
}

export class OAuth2Gateway extends Context.Tag(
  "@effect-workos/workos/OAuth2Gateway"
)<OAuth2Gateway, Service>() {}

export const makeTest = (): Effect.Effect<Service, never, Store.Store> =>
  Effect.gen(function*() {
    const { oauth2Client } = yield* Store.Store

    return OAuth2Gateway.of({ client: oauth2Client })
  })

export const layerTest = () => Layer.effect(OAuth2Gateway, makeTest())

export const make = (): Effect.Effect<Service, never, OAuth2Client.OAuth2Client> =>
  Effect.gen(function*() {
    const { client } = yield* OAuth2Client.OAuth2Client

    return OAuth2Gateway.of({
      client: {
        retrieveTokenByClientCredentials: (parameters) =>
          pipe(
            client.retrieveTokenByClientCredentials(parameters),
            Effect.orDie
          )
      }
    })
  })

export const layer = () => Layer.effect(OAuth2Gateway, make())
