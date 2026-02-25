import * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as Config from "effect/Config"
import type { ConfigError } from "effect/ConfigError"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Jose from "jose"
import type { ApplicationClientId } from "./domain/Ids.ts"
import { KeyPairTest } from "./internal/KeyPair.ts"
import * as TokenClientDefinitions from "./internal/TokenClientDefinitions.ts"

export interface Service {
  readonly client: TokenClientDefinitions.Client
}

export class TokenClient extends Context.Tag(
  "@effect/auth-workos/TokenClient"
)<TokenClient, Service>() {}

export const makeTest = (
  options: {
    publicKey: Jose.CryptoKey
  }
) =>
  Effect.gen(function*() {
    const jwks = yield* pipe(
      Effect.promise(() => Jose.exportJWK(options.publicKey)),
      Effect.map((jwk) => Jose.createLocalJWKSet({ keys: [jwk] })),
      Effect.cached
    )

    return TokenClient.of({
      client: TokenClientDefinitions.make(jwks)
    })
  })

export const layerTest = (
  options: {
    publicKey: Jose.CryptoKey
  }
) => Layer.effect(TokenClient, makeTest(options))

export const layerKeyPairTest = () =>
  pipe(
    Effect.gen(function*() {
      const { publicKey } = yield* KeyPairTest

      return layerTest({ publicKey })
    }),
    Layer.unwrapEffect,
    Layer.provide(KeyPairTest.Default)
  )

export const make = (
  options: {
    /**
     * The WorkOS OAuth Application Client ID
     */
    readonly clientId: ApplicationClientId
  }
): Effect.Effect<Service, never, HttpClient.HttpClient> =>
  Effect.gen(function*() {
    const httpClient = yield* HttpClient.HttpClient

    const jwks = yield* pipe(
      HttpClientRequest.get(`https://api.workos.com/sso/jwks/${options.clientId}`),
      httpClient.execute,
      Effect.flatMap((_) => _.json),
      Effect.map((jwks) => Jose.createLocalJWKSet(jwks as Jose.JSONWebKeySet)),
      Effect.cachedWithTTL("5 minutes")
    )

    return TokenClient.of({
      client: TokenClientDefinitions.make(jwks)
    })
  })

export const layer = (
  options: {
    readonly clientId: ApplicationClientId
  }
): Layer.Layer<TokenClient, never, HttpClient.HttpClient> => Layer.effect(TokenClient, make(options))

export const layerConfig = (
  options: {
    readonly clientId: Config.Config<ApplicationClientId>
  }
): Layer.Layer<TokenClient, ConfigError, HttpClient.HttpClient> => {
  return pipe(
    Config.all(options),
    Effect.flatMap((configs) => make(configs)),
    Layer.effect(TokenClient)
  )
}
