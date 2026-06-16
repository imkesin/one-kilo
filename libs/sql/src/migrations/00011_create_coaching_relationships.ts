import * as SqlClient from "@effect/sql/SqlClient"
import * as Effect from "effect/Effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  /*
   * Required for the EXCLUDE constraint below: btree_gist lets GiST index the UUID equality
   * predicates (coach_id, athlete_id) alongside the range overlap.
   */
  yield* sql`CREATE EXTENSION IF NOT EXISTS btree_gist`

  yield* sql`
    CREATE TABLE coaching_relationships (
      id UUID PRIMARY KEY DEFAULT uuidv7(),

      coach_id UUID NOT NULL,
      athlete_id UUID NOT NULL,

      period DATERANGE NOT NULL,

      created_by_user_id UUID NOT NULL,
      updated_by_user_id UUID NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

      archived_at TIMESTAMPTZ,

      CONSTRAINT fk_cr_coach FOREIGN KEY (coach_id) REFERENCES coaches (id),
      CONSTRAINT fk_cr_athlete FOREIGN KEY (athlete_id) REFERENCES athletes (id),
      CONSTRAINT fk_cr_created_by FOREIGN KEY (created_by_user_id) REFERENCES users (id),
      CONSTRAINT fk_cr_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users (id),

      CONSTRAINT excl_cr_no_overlap EXCLUDE USING gist (
        coach_id WITH =,
        athlete_id WITH =,
        period WITH &&
      ) WHERE (archived_at IS NULL)
    )
  `

  yield* sql`CREATE INDEX idx_cr_coach ON coaching_relationships (coach_id)`
  yield* sql`CREATE INDEX idx_cr_athlete ON coaching_relationships (athlete_id)`
})
