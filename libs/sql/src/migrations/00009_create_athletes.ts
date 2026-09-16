import * as SqlClient from "@effect/sql/SqlClient"
import * as Effect from "effect/Effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE athletes (
      id UUID PRIMARY KEY DEFAULT uuidv7(),

      person_id UUID NOT NULL,

      created_by_account_id UUID NOT NULL,
      updated_by_account_id UUID NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

      archived_at TIMESTAMPTZ,

      CONSTRAINT fk_ath_person FOREIGN KEY (person_id) REFERENCES persons (id),
      CONSTRAINT fk_ath_created_by FOREIGN KEY (created_by_account_id) REFERENCES accounts (id),
      CONSTRAINT fk_ath_updated_by FOREIGN KEY (updated_by_account_id) REFERENCES accounts (id)
    )
  `

  yield* sql`CREATE UNIQUE INDEX idx_ath_person ON athletes (person_id)`
})
