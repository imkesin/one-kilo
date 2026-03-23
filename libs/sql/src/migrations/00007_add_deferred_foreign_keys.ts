import * as SqlClient from "@effect/sql/SqlClient"
import * as Effect from "effect/Effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    ALTER TABLE persons
    ADD CONSTRAINT fk_p_created_by FOREIGN KEY (created_by_user_id) REFERENCES users (id),
    ADD CONSTRAINT fk_p_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users (id)
  `

  yield* sql`
    ALTER TABLE workspaces
    ADD CONSTRAINT fk_ws_created_by FOREIGN KEY (created_by_user_id) REFERENCES users (id),
    ADD CONSTRAINT fk_ws_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users (id)
  `

  yield* sql`
    ALTER TABLE users
    ADD CONSTRAINT fk_u_machine_client FOREIGN KEY (machine_client_id) REFERENCES machine_clients (id)
  `
})
