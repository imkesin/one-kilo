import { describe, expect, layer } from "@effect/vitest"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as TestClock from "effect/TestClock"
import { generateSessionId, generateUserId } from "../src/domain/DomainIds.ts"
import * as TokenClient from "../src/TokenClient.ts"
import * as TokenGenerator from "../src/TokenGenerator.ts"

export const unitTestLayer = Layer.merge(
  TokenClient.layerKeyPairTest(),
  TokenGenerator.layerKeyPairTest()
)

describe("TokenClient - Unit", () => {
  layer(unitTestLayer)((it) => {
    it.effect("a minimal token that can be decoded and verified", () =>
      Effect.gen(function*() {
        const { generator } = yield* TokenGenerator.TokenGenerator
        const { client } = yield* TokenClient.TokenClient

        const sessionId = generateSessionId()
        const userId = generateUserId()

        const token = yield* generator.generateSessionToken({ sessionId, userId })

        const decoded = yield* client.decodeAccessToken(token)

        if (decoded._tag !== "DecodedSessionAccessToken") {
          expect.fail("Expected a session token, but received another variant")
        }

        expect(decoded.sub).toEqual(userId)
        expect(decoded.sid).toEqual(sessionId)

        const verified = yield* client.verifyAccessToken(token)

        if (verified._tag !== "DecodedSessionAccessToken") {
          expect.fail("Expected a session token, but received another variant")
        }

        expect(verified.sub).toEqual(userId)
        expect(verified.sid).toEqual(sessionId)
      }))

    it.effect("an expired token can be decoded but not verified", () =>
      Effect.gen(function*() {
        const { generator } = yield* TokenGenerator.TokenGenerator
        const { client } = yield* TokenClient.TokenClient

        const sessionId = generateSessionId()
        const userId = generateUserId()

        const token = yield* generator.generateSessionToken({ sessionId, userId })

        const decoded = yield* client.decodeAccessToken(token)

        if (decoded._tag !== "DecodedSessionAccessToken") {
          expect.fail("Expected a session token, but received another variant")
        }

        expect(decoded.sub).toEqual(userId)
        expect(decoded.sid).toEqual(sessionId)

        yield* TestClock.adjust("5 minutes")

        const verificationError = yield* pipe(
          client.verifyAccessToken(token),
          Effect.flip
        )

        expect(verificationError._tag).toEqual("ExpiredTokenError")
      }))
  })
})
