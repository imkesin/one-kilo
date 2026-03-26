import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import * as SqlClient from "@effect/sql/SqlClient"
import * as PgLayers from "@one-kilo/sql/PgLayers"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"

const MIGRATION_TABLE = "effect_sql_migrations"

const main = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  const tables = yield* sql<{ tableName: string }>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name != ${MIGRATION_TABLE}
  `

  if (tables.length === 0) {
    yield* Effect.log("No tables to truncate")
    return
  }

  const tableNames = tables.map((t) => t.tableName)

  yield* sql.unsafe(`TRUNCATE ${tableNames.join(", ")} CASCADE`)
  yield* Effect.log(`Truncated ${tableNames.length} tables: ${tableNames.join(", ")}`)
})

pipe(
  main,
  Effect.provide(PgLayers.layer()),
  NodeRuntime.runMain
)
