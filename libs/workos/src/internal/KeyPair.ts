import * as Effect from "effect/Effect"
import * as Jose from "jose"

export class KeyPairTest extends Effect.Service<KeyPairTest>()(
  "@effect-workos/workos/KeyPairTest",
  {
    dependencies: [],
    effect: Effect.gen(function*() {
      const { publicKey, privateKey } = yield* Effect.promise(() => Jose.generateKeyPair("RS256"))

      return { publicKey, privateKey } as const
    })
  }
) {}
