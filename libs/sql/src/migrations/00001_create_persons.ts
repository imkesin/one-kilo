import * as SqlClient from "@effect/sql/SqlClient"
import * as Effect from "effect/Effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE persons (
      id UUID PRIMARY KEY DEFAULT uuidv7(),

      created_by_user_id UUID NOT NULL,
      updated_by_user_id UUID NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

      archived_at TIMESTAMPTZ,

      preferred_name TEXT NOT NULL,
      full_name TEXT NOT NULL
    )
  `
})
