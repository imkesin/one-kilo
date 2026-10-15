import * as Clock from "effect/Clock"
import * as Context from "effect/Context"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Random from "effect/Random"
import * as Semaphore from "effect/Semaphore"
import * as UUIDGeneratorUtils from "./internal/UUIDGeneratorUtils.ts"

export class UUIDGenerator extends Context.Service<UUIDGenerator>()(
  "@one-kilo/lib/UUIDGenerator",
  {
    make: Effect.gen(function*() {
      const MAX_RANDOM_A = 0xfff
      const MAX_RANDOM_B_HI = 0x3fff_ffff
      const MAX_RANDOM_B_LO = 0xffff_ffff

      const semaphore = yield* Semaphore.make(1)

      const generateRandomA = Random.nextIntBetween(0, MAX_RANDOM_A + 1)
      const generateRandomBHi = Random.nextIntBetween(0, MAX_RANDOM_B_HI + 1)
      const generateRandomBLo = Random.nextIntBetween(0, MAX_RANDOM_B_LO + 1)

      const generateRandomIncrement = Random.nextIntBetween(1, 0x100)

      let millis = yield* Clock.currentTimeMillis

      let randomA = yield* generateRandomA
      let randomBHi = yield* generateRandomBHi
      let randomBLo = yield* generateRandomBLo

      const v7 = pipe(
        Effect.gen(function*() {
          const currentMillis = yield* Clock.currentTimeMillis

          if (currentMillis > millis) {
            millis = currentMillis
            randomA = yield* generateRandomA
            randomBHi = yield* generateRandomBHi
            randomBLo = yield* generateRandomBLo
          } else {
            randomBLo += yield* generateRandomIncrement

            if (randomBLo > MAX_RANDOM_B_LO) {
              yield* Effect.sleep(Duration.millis(1))

              millis = yield* Clock.currentTimeMillis
              randomA = yield* generateRandomA
              randomBHi = yield* generateRandomBHi
              randomBLo = yield* generateRandomBLo
            }
          }

          return UUIDGeneratorUtils.buildUUID(
            millis,
            randomA,
            randomBHi,
            randomBLo
          )
        }),
        semaphore.withPermits(1)
      )

      return { v7 }
    })
  }
) {
  static readonly layer = Layer.effect(this, this.make)
}
