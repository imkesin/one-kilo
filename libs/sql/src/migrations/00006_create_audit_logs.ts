import * as SqlClient from "@effect/sql/SqlClient"
import * as Effect from "effect/Effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE audit_logs (
      id UUID PRIMARY KEY DEFAULT uuidv7(),

      performed_by_account_id UUID NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      version INTEGER NOT NULL,

      trace_id TEXT NOT NULL,
      type TEXT NOT NULL,
      targets JSONB NOT NULL,

      context JSONB,

      CONSTRAINT fk_audit_log_performed_by FOREIGN KEY (performed_by_account_id) REFERENCES accounts (id)
    )
  `

  yield* sql`CREATE INDEX idx_audit_log_performed_by ON audit_logs (performed_by_account_id)`
  yield* sql`CREATE INDEX idx_audit_log_targets ON audit_logs USING GIN (targets jsonb_path_ops)`
})
