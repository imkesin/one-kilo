import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Jose from "jose"
import { KeyPairTest } from "./internal/KeyPair.ts"
import * as TokenGeneratorDefinitions from "./internal/TokenGeneratorDefinitions.ts"

export interface Service {
  readonly generator: TokenGeneratorDefinitions.Generator
}

export class TokenGenerator extends Context.Tag(
  "@effect-workos/workos/TokenGenerator"
)<TokenGenerator, Service>() {}

export const makeTest = (
  options: {
    readonly privateKey: Jose.CryptoKey
  }
): Effect.Effect<Service> =>
  Effect.succeed({
    generator: TokenGeneratorDefinitions.makeTest(options)
  })

export const layerTest = (
  options: {
    readonly privateKey: Jose.CryptoKey
  }
): Layer.Layer<TokenGenerator> => Layer.effect(TokenGenerator, makeTest(options))

export const layerKeyPairTest = () =>
  pipe(
    Effect.gen(function*() {
      const { privateKey } = yield* KeyPairTest

      return layerTest({ privateKey })
    }),
    Layer.unwrapEffect,
    Layer.provide(KeyPairTest.Default)
  )
