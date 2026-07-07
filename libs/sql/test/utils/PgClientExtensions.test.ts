import * as PgClient from "@effect/sql-pg/PgClient"
import * as SqlClient from "@effect/sql/SqlClient"
import { describe, layer } from "@effect/vitest"
import * as Deferred from "effect/Deferred"
import * as Effect from "effect/Effect"
import * as Fiber from "effect/Fiber"
import { pipe } from "effect/Function"
import * as Ref from "effect/Ref"
import { expect } from "vitest"
import * as PgLayers from "../../src/PgLayers.ts"
import { withSerializableTransaction } from "../../src/utils/PgClientExtensions.ts"

const layerTest = PgLayers.layer({ defaultDatabase: "test" })

describe("`withSerializableTransaction`", () => {
  layer(layerTest, { excludeTestServices: true })("using live Postgres", (it) => {
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
        expect(result?.value).toBe(2)

        // Transaction B should have retried at least once
        const attempts = yield* Ref.get(bAttempts)
        expect(attempts).toBeGreaterThan(1)
      }))

    it.effect("nests inside an existing transaction without re-setting the isolation level", () =>
      Effect.gen(function*() {
        const sql = yield* SqlClient.SqlClient
        const pg = yield* PgClient.PgClient

        yield* sql`CREATE TABLE IF NOT EXISTS _test_nested_tx (id INT PRIMARY KEY)`
        yield* sql`TRUNCATE _test_nested_tx`

        const inner = pipe(
          Effect.gen(function*() {
            const sql = yield* SqlClient.SqlClient
            yield* sql`INSERT INTO _test_nested_tx (id) VALUES (2)`
          }),
          withSerializableTransaction(pg)
        )

        const outer = pipe(
          Effect.gen(function*() {
            const sql = yield* SqlClient.SqlClient
            /*
             * A statement runs in the outer transaction *before* the nested call. This is exactly
             * the condition under which a second `SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`
             * would fail with Postgres `25001` ("must be called before any query"). The nested call
             * detects the active `TransactionConnection` and joins it instead of re-issuing the SET.
             */
            yield* sql`INSERT INTO _test_nested_tx (id) VALUES (1)`
            yield* inner
          }),
          withSerializableTransaction(pg)
        )

        yield* outer

        const rows = yield* sql`SELECT id FROM _test_nested_tx ORDER BY id`
        expect(rows.map((row) => row.id)).toEqual([1, 2])
      }))

    it.effect("ties a nested transaction to the outer one, so it rolls back with it", () =>
      Effect.gen(function*() {
        const sql = yield* SqlClient.SqlClient
        const pg = yield* PgClient.PgClient

        yield* sql`CREATE TABLE IF NOT EXISTS _test_nested_tx_rollback (id INT PRIMARY KEY)`
        yield* sql`TRUNCATE _test_nested_tx_rollback`

        const inner = pipe(
          Effect.gen(function*() {
            const sql = yield* SqlClient.SqlClient
            yield* sql`INSERT INTO _test_nested_tx_rollback (id) VALUES (2)`
          }),
          withSerializableTransaction(pg)
        )

        const outer = pipe(
          Effect.gen(function*() {
            const sql = yield* SqlClient.SqlClient
            yield* sql`INSERT INTO _test_nested_tx_rollback (id) VALUES (1)`
            yield* inner
            // Fail the outer transaction *after* the nested one completed successfully.
            return yield* Effect.fail("rollback" as const)
          }),
          withSerializableTransaction(pg)
        )

        yield* Effect.either(outer)

        // The nested insert was not an independent commit: rolling back the outer discards both.
        const rows = yield* sql`SELECT id FROM _test_nested_tx_rollback`
        expect(rows.length).toBe(0)
      }))

    it.effect("bubbles a nested serialization conflict up to the outermost retry", () =>
      Effect.gen(function*() {
        const sql = yield* SqlClient.SqlClient
        const pg = yield* PgClient.PgClient

        yield* sql`CREATE TABLE IF NOT EXISTS _test_nested_conflict (id INT PRIMARY KEY, value INT NOT NULL)`
        yield* sql`TRUNCATE _test_nested_conflict`
        yield* sql`INSERT INTO _test_nested_conflict (id, value) VALUES (1, 0)`

        const aHasRead = yield* Deferred.make<void>()
        const bHasRead = yield* Deferred.make<void>()
        const aDone = yield* Deferred.make<void>()

        // How many times B's *outer* body runs — proves a conflict raised inside the nested call
        // replayed the entire outer transaction.
        const bOuterAttempts = yield* Ref.make(0)

        const txA = pipe(
          Effect.gen(function*() {
            const sql = yield* SqlClient.SqlClient
            yield* sql`SELECT value FROM _test_nested_conflict WHERE id = 1`
            yield* Deferred.succeed(aHasRead, void 0)
            yield* Deferred.await(bHasRead)
            yield* sql`UPDATE _test_nested_conflict SET value = value + 1 WHERE id = 1`
          }),
          withSerializableTransaction(pg),
          Effect.tap(() => Deferred.succeed(aDone, void 0))
        )

        // B's conflicting read+write live inside a nested transaction. On the first attempt the
        // write hits a 40001 that must bubble out to B's outermost retry.
        const txB = pipe(
          Effect.gen(function*() {
            yield* Ref.update(bOuterAttempts, (n) => n + 1)

            yield* pipe(
              Effect.gen(function*() {
                const sql = yield* SqlClient.SqlClient
                yield* Deferred.await(aHasRead)
                yield* sql`SELECT value FROM _test_nested_conflict WHERE id = 1`
                yield* Deferred.succeed(bHasRead, void 0)
                yield* Deferred.await(aDone)
                yield* sql`UPDATE _test_nested_conflict SET value = value + 1 WHERE id = 1`
              }),
              withSerializableTransaction(pg)
            )
          }),
          withSerializableTransaction(pg)
        )

        const fiberA = yield* Effect.fork(txA)
        const fiberB = yield* Effect.fork(txB)
        yield* Fiber.join(fiberA)
        yield* Fiber.join(fiberB)

        // Both increments applied — the replayed outer transaction re-read and succeeded.
        const [result] = yield* sql`SELECT value FROM _test_nested_conflict WHERE id = 1`
        expect(result?.value).toBe(2)

        // The whole outer transaction replayed in response to the nested conflict.
        const attempts = yield* Ref.get(bOuterAttempts)
        expect(attempts).toBeGreaterThan(1)
      }))
  })
})
