import * as SqlClient from "@effect/sql/SqlClient"
import * as Effect from "effect/Effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE workspace_memberships (
      id UUID PRIMARY KEY DEFAULT uuidv7(),

      account_id UUID NOT NULL,
      workspace_id UUID NOT NULL,
      created_by_account_id UUID NOT NULL,
      updated_by_account_id UUID NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

      archived_at TIMESTAMPTZ,

      role TEXT NOT NULL,
      workos_organization_membership_id TEXT NOT NULL,

      CONSTRAINT fk_wm_account FOREIGN KEY (account_id) REFERENCES accounts (id),
      CONSTRAINT fk_wm_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id),
      CONSTRAINT fk_wm_created_by FOREIGN KEY (created_by_account_id) REFERENCES accounts (id),
      CONSTRAINT fk_wm_updated_by FOREIGN KEY (updated_by_account_id) REFERENCES accounts (id)
    )
  `

  yield* sql`CREATE UNIQUE INDEX idx_wm_account_workspace ON workspace_memberships (account_id, workspace_id)`
  yield* sql`CREATE INDEX idx_wm_workspace ON workspace_memberships (workspace_id)`
  yield* sql`CREATE UNIQUE INDEX idx_wm_workos_org_membership ON workspace_memberships (workos_organization_membership_id)`
})
