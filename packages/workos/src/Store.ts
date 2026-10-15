import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import type * as KeyValueStore from "effect/persistence/KeyValueStore"
import * as StoreDefinitions from "./internal/StoreDefinitions.ts"
import type * as TokenGenerator from "./TokenGenerator.ts"

export interface Service {
  readonly apiClient: StoreDefinitions.ApiClient
  readonly oauth2Client: StoreDefinitions.OAuth2Client
}

export class Store extends Context.Service<Store, Service>()(
  "@effect/auth-workos/Store"
) {}

export const makeTest = (options?: StoreDefinitions.MakeOptions): Effect.Effect<
  Service,
  never,
  KeyValueStore.KeyValueStore | TokenGenerator.TokenGenerator
> =>
  Effect.map(
    StoreDefinitions.make(options),
    Store.of
  )

export const layerTest = (options?: StoreDefinitions.MakeOptions) =>
  Layer.effect(
    Store,
    makeTest(options)
  )
