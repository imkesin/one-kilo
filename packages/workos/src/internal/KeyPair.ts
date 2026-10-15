import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Jose from "jose"

export class KeyPairTest extends Context.Service<KeyPairTest>()(
  "@effect/auth-workos/KeyPairTest",
  {
    make: Effect.gen(function*() {
      const { publicKey, privateKey } = yield* Effect.promise(() => Jose.generateKeyPair("RS256"))

      return { publicKey, privateKey } as const
    })
  }
) {
  static readonly layer = Layer.effect(this, this.make)
}
