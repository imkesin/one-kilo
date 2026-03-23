import * as SqlClient from "@effect/sql/SqlClient"
import * as Effect from "effect/Effect"
import {
  MachineClientsCreatedByForeignKey,
  MachineClientsUpdatedByForeignKey
} from "../modules/machine-clients/MachineClientsForeignKeys.ts"
import { PersonsCreatedByForeignKey, PersonsUpdatedByForeignKey } from "../modules/persons/PersonsForeignKeys.ts"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT uuidv7(),

      created_by_user_id UUID NOT NULL,
      updated_by_user_id UUID NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

      person_id UUID,
      machine_client_id UUID,
      archived_at TIMESTAMPTZ,

      type TEXT NOT NULL,

      workos_user_id TEXT,
      workos_client_id TEXT,

      CONSTRAINT fk_u_person FOREIGN KEY (person_id) REFERENCES persons (id),
      CONSTRAINT fk_u_machine_client FOREIGN KEY (machine_client_id) REFERENCES machine_clients (id),
      CONSTRAINT fk_u_created_by FOREIGN KEY (created_by_user_id) REFERENCES users (id),
      CONSTRAINT fk_u_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users (id),

      CONSTRAINT check_u_type_consistency CHECK (
        (
          type = 'Person'
          AND person_id IS NOT NULL
          AND machine_client_id IS NULL
          AND workos_user_id IS NOT NULL
          AND workos_client_id IS NULL
        ) OR (
          type = 'MachineClient'
          AND person_id IS NULL
          AND machine_client_id IS NOT NULL
          AND workos_user_id IS NULL
          AND workos_client_id IS NOT NULL
        )
      )
    )
  `

  yield* sql`CREATE INDEX idx_u_person ON users (person_id)`
  yield* sql`CREATE INDEX idx_u_machine_client ON users (machine_client_id)`
  yield* sql`CREATE UNIQUE INDEX idx_u_workos_user ON users (workos_user_id)`
  yield* sql`CREATE UNIQUE INDEX idx_u_workos_client ON users (workos_client_id)`

  yield* sql`
    ALTER TABLE persons
      ADD CONSTRAINT ${sql.unsafe(PersonsCreatedByForeignKey)}
      FOREIGN KEY (created_by_user_id)
      REFERENCES users (id)
      DEFERRABLE INITIALLY IMMEDIATE,

      ADD CONSTRAINT ${sql.unsafe(PersonsUpdatedByForeignKey)}
      FOREIGN KEY (updated_by_user_id)
      REFERENCES users (id)
      DEFERRABLE INITIALLY IMMEDIATE
  `

  yield* sql`
    ALTER TABLE machine_clients
      ADD CONSTRAINT ${sql.unsafe(MachineClientsCreatedByForeignKey)}
      FOREIGN KEY (created_by_user_id)
      REFERENCES users (id)
      DEFERRABLE INITIALLY IMMEDIATE,

      ADD CONSTRAINT ${sql.unsafe(MachineClientsUpdatedByForeignKey)}
      FOREIGN KEY (updated_by_user_id)
      REFERENCES users (id)
      DEFERRABLE INITIALLY IMMEDIATE
  `
})
