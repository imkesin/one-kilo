import * as Config from "effect/Config"
import type { ConfigError } from "effect/Config"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as HttpClient from "effect/http/HttpClient"
import * as HttpClientRequest from "effect/http/HttpClientRequest"
import * as Layer from "effect/Layer"
import * as Jose from "jose"
import type { EnvironmentClientId } from "./domain/Ids.ts"
import { KeyPairTest } from "./internal/KeyPair.ts"
import * as TokenClientDefinitions from "./internal/TokenClientDefinitions.ts"

export type Service = TokenClientDefinitions.Client

export class TokenClient extends Context.Service<TokenClient, Service>()(
  "@effect/auth-workos/TokenClient"
) {}

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

    return TokenClient.of(TokenClientDefinitions.make(jwks))
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
    Layer.unwrap,
    Layer.provide(KeyPairTest.layer)
  )

export const make = (
  options: {
    /**
     * The WorkOS Environment-Specific Client ID
     */
    readonly clientId: EnvironmentClientId
  }
): Effect.Effect<Service, never, HttpClient.HttpClient> =>
  Effect.gen(function*() {
    const httpClient = yield* HttpClient.HttpClient

    const jwks = yield* pipe(
      HttpClientRequest.get(`https://api.workos.com/sso/jwks/${options.clientId}`),
      httpClient.execute,
      Effect.flatMap((_) => _.json),
      Effect.map((jwks) => Jose.createLocalJWKSet(jwks as unknown as Jose.JSONWebKeySet)),
      Effect.cachedWithTTL("5 minutes")
    )

    return TokenClient.of(TokenClientDefinitions.make(jwks))
  })

export const layer = (
  options: {
    readonly clientId: EnvironmentClientId
  }
): Layer.Layer<TokenClient, never, HttpClient.HttpClient> => Layer.effect(TokenClient, make(options))

export const layerConfig = (
  options: {
    readonly clientId: Config.Config<EnvironmentClientId>
  }
): Layer.Layer<TokenClient, ConfigError, HttpClient.HttpClient> => {
  return pipe(
    Config.all(options),
    Effect.flatMap((configs) => make(configs)),
    Layer.effect(TokenClient)
  )
}
