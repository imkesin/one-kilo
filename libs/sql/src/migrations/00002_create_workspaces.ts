import * as SqlClient from "@effect/sql/SqlClient"
import * as Effect from "effect/Effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE workspaces (
      id UUID PRIMARY KEY DEFAULT uuidv7(),

      created_by_user_id UUID NOT NULL,
      updated_by_user_id UUID NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

      archived_at TIMESTAMPTZ,

      name TEXT NOT NULL,
      type TEXT NOT NULL,
      workos_organization_id TEXT NOT NULL
    )
  `

  yield* sql`CREATE UNIQUE INDEX idx_ws_workos_organization_id ON workspaces (workos_organization_id)`
})
