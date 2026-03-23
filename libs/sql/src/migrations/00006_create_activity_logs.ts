import * as SqlClient from "@effect/sql/SqlClient"
import * as Effect from "effect/Effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE activity_logs (
      id UUID PRIMARY KEY DEFAULT uuidv7(),

      performed_by_user_id UUID NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      version INTEGER NOT NULL,

      trace_id TEXT NOT NULL,
      type TEXT NOT NULL,
      targets JSONB NOT NULL,

      context JSONB,

      CONSTRAINT fk_al_performed_by FOREIGN KEY (performed_by_user_id) REFERENCES users (id)
    )
  `

  yield* sql`CREATE INDEX idx_al_performed_by ON activity_logs (performed_by_user_id)`
  yield* sql`CREATE INDEX idx_al_targets ON activity_logs USING GIN (targets jsonb_path_ops)`
})
