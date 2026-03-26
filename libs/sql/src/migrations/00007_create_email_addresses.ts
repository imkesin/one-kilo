import * as SqlClient from "@effect/sql/SqlClient"
import * as Effect from "effect/Effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE email_addresses (
      id UUID PRIMARY KEY DEFAULT uuidv7(),

      created_by_user_id UUID NOT NULL,
      updated_by_user_id UUID NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

      archived_at TIMESTAMPTZ,

      person_id UUID NOT NULL,
      value TEXT NOT NULL,

      CONSTRAINT fk_ea_person FOREIGN KEY (person_id) REFERENCES persons (id),
      CONSTRAINT fk_ea_created_by FOREIGN KEY (created_by_user_id) REFERENCES users (id),
      CONSTRAINT fk_ea_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users (id)
    )
  `

  yield* sql`CREATE UNIQUE INDEX idx_ea_person_value ON email_addresses (person_id, value)`
})
