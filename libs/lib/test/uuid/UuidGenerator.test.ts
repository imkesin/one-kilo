import { describe, layer } from "@effect/vitest"
import * as Clock from "effect/Clock"
import * as Effect from "effect/Effect"
import { expect } from "vitest"
import { UuidGenerator } from "../../src/uuid/UuidGenerator.js"

const testLayer = UuidGenerator.Default

describe("UuidGenerator", () => {
  layer(testLayer)("v7", (it) => {
    it.effect("generates unique UUIDs within the same millisecond", () =>
      Effect.gen(function*() {
        const count = 10_000
        const uuids: string[] = []

        for (let i = 0; i < count; i++) {
          const uuid = yield* UuidGenerator.v7
          uuids.push(uuid)
        }

        expect(new Set(uuids).size).toBe(count)
      })
    )

    it.effect("generates UUIDs with varying suffixes for human readability", () =>
      Effect.gen(function*() {
        const count = 100
        const suffixes: string[] = []

        for (let i = 0; i < count; i++) {
          const uuid = yield* UuidGenerator.v7
          const suffix = uuid.split("-").pop()!
          suffixes.push(suffix)
        }

        // Each consecutive suffix should differ
        for (let i = 1; i < suffixes.length; i++) {
          expect(suffixes[i]).not.toBe(suffixes[i - 1])
        }

        // All suffixes should be unique
        expect(new Set(suffixes).size).toBe(count)
      })
    )

    it.effect("generates UUIDs in sortable order", () =>
      Effect.gen(function*() {
        const count = 1_000
        const uuids: string[] = []

        for (let i = 0; i < count; i++) {
          const uuid = yield* UuidGenerator.v7
          uuids.push(uuid)
        }

        const sorted = [...uuids].sort()
        expect(uuids).toEqual(sorted)
      })
    )

    it.effect("encodes correct timestamp in UUID", () =>
      Effect.gen(function*() {
        const currentMs = yield* Clock.currentTimeMillis

        const uuid = yield* UuidGenerator.v7

        // Extract first 12 hex chars (timestamp portion)
        const timestampHex = uuid.replace(/-/g, "").substring(0, 12)
        const encodedMs = parseInt(timestampHex, 16)

        // Should be within a small margin of current time
        expect(Math.abs(encodedMs - Number(currentMs))).toBeLessThan(10)
      })
    )
  })
})
