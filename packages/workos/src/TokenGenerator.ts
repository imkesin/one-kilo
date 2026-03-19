import * as Config from "effect/Config"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Jose from "jose"
import { KeyPairTest } from "./internal/KeyPair.ts"
import * as TokenGeneratorDefinitions from "./internal/TokenGeneratorDefinitions.ts"

export type Service = TokenGeneratorDefinitions.Generator

export class TokenGenerator extends Context.Tag(
  "@effect/auth-workos/TokenGenerator"
)<TokenGenerator, Service>() {}

export const makeTest = (
  options: {
    readonly authKitDomain: string
    readonly privateKey: Jose.CryptoKey
  }
): Effect.Effect<Service> => Effect.succeed(TokenGeneratorDefinitions.makeTest(options))

export const layerTest = (
  options: {
    readonly authKitDomain: string
    readonly privateKey: Jose.CryptoKey
  }
): Layer.Layer<TokenGenerator> => Layer.effect(TokenGenerator, makeTest(options))

export const layerKeyPairTest = (options: { readonly authKitDomain: string }) =>
  pipe(
    Effect.flatMap(
      KeyPairTest,
      ({ privateKey }) => makeTest({ authKitDomain: options.authKitDomain, privateKey })
    ),
    Layer.effect(TokenGenerator),
    Layer.provide(KeyPairTest.Default)
  )

export const layerKeyPairTestConfig = (options: { readonly authKitDomain: Config.Config<string> }) =>
  pipe(
    Effect.all([Config.all(options), KeyPairTest]),
    Effect.flatMap(([{ authKitDomain }, { privateKey }]) => makeTest({ authKitDomain, privateKey })),
    Layer.effect(TokenGenerator),
    Layer.provide(KeyPairTest.Default)
  )
