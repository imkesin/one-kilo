import * as PgClient from "@effect/sql-pg/PgClient"
import * as SqlClient from "@effect/sql/SqlClient"
import { describe, layer } from "@effect/vitest"
import * as Deferred from "effect/Deferred"
import * as Effect from "effect/Effect"
import * as Fiber from "effect/Fiber"
import { pipe } from "effect/Function"
import * as Ref from "effect/Ref"
import { expect } from "vitest"
import { SqlLiveWithoutMigrations } from "../../src/Sql.ts"
import { withSerializableTransaction } from "../../src/utils/PgClientExtensions.ts"

// TODO - This needs to be verified next

describe("withSerializableTransaction", () => {
  layer(SqlLiveWithoutMigrations)("with real Postgres", (it) => {
    it.effect("retries on serialization conflict between concurrent transactions", () =>
      Effect.gen(function*() {
        const sql = yield* SqlClient.SqlClient
        const pg = yield* PgClient.PgClient

        // Setup: create a simple counter table for the test
        yield* sql`CREATE TABLE IF NOT EXISTS _test_serializable_counter (id INT PRIMARY KEY, value INT NOT NULL)`
        yield* sql`TRUNCATE _test_serializable_counter`
        yield* sql`INSERT INTO _test_serializable_counter (id, value) VALUES (1, 0)`

        // Deferreds to orchestrate the exact interleaving that causes a conflict
        const aHasRead = yield* Deferred.make<void>()
        const bHasRead = yield* Deferred.make<void>()
        const aDone = yield* Deferred.make<void>()

        // Track how many times Transaction B's effect executes
        const bAttempts = yield* Ref.make(0)

        // Transaction A: read → signal → wait for B to read → write → commit
        const txA = pipe(
          Effect.gen(function*() {
            const sql = yield* SqlClient.SqlClient
            yield* sql`SELECT value FROM _test_serializable_counter WHERE id = 1`
            yield* Deferred.succeed(aHasRead, void 0)
            yield* Deferred.await(bHasRead)
            yield* sql`UPDATE _test_serializable_counter SET value = value + 1 WHERE id = 1`
          }),
          withSerializableTransaction(pg),
          Effect.tap(() => Deferred.succeed(aDone, void 0))
        )

        // Transaction B: wait for A to read → read → signal → wait for A to commit → write
        // On first attempt, this forces a serialization conflict (40001).
        // On retry, all deferreds are already resolved so it proceeds immediately and succeeds.
        const txB = pipe(
          Effect.gen(function*() {
            const sql = yield* SqlClient.SqlClient
            yield* Ref.update(bAttempts, (n) => n + 1)
            yield* Deferred.await(aHasRead)
            yield* sql`SELECT value FROM _test_serializable_counter WHERE id = 1`
            yield* Deferred.succeed(bHasRead, void 0)
            yield* Deferred.await(aDone)
            yield* sql`UPDATE _test_serializable_counter SET value = value + 1 WHERE id = 1`
          }),
          withSerializableTransaction(pg)
        )

        // Run both transactions concurrently
        const fiberA = yield* Effect.fork(txA)
        const fiberB = yield* Effect.fork(txB)
        yield* Fiber.join(fiberA)
        yield* Fiber.join(fiberB)

        // Both increments should have been applied
        const [result] = yield* sql`SELECT value FROM _test_serializable_counter WHERE id = 1`
        expect(result.value).toBe(2)

        // Transaction B should have retried at least once
        const attempts = yield* Ref.get(bAttempts)
        expect(attempts).toBeGreaterThan(1)
      }), { timeout: 5_000 })
  })
})
