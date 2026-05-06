import * as SqlClient from "@effect/sql/SqlClient"
import * as Effect from "effect/Effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE workflow_suspensions (
      id UUID PRIMARY KEY DEFAULT uuidv7(),

      occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resumed_at TIMESTAMPTZ,
      dismissed_at TIMESTAMPTZ,

      execution_id TEXT NOT NULL,
      workflow_name TEXT NOT NULL,

      CONSTRAINT check_ws_single_outcome CHECK (
        resumed_at IS NULL OR dismissed_at IS NULL
      )
    )
  `

  yield* sql`CREATE INDEX idx_ws_execution ON workflow_suspensions (execution_id)`
})
