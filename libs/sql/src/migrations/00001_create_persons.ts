import * as Effect from "effect/Effect"
import * as SqlClient from "effect/sql/SqlClient"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE persons (
      id UUID PRIMARY KEY DEFAULT uuidv7(),
      version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),

      created_by_account_id UUID NOT NULL,
      updated_by_account_id UUID NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

      archived_at TIMESTAMPTZ,

      preferred_name TEXT NOT NULL,
      full_name TEXT NOT NULL,

      sex TEXT CHECK (sex IN ('Male', 'Female')),
      date_of_birth DATE,

      timezone TEXT NOT NULL DEFAULT 'UTC'
    )
  `
})
