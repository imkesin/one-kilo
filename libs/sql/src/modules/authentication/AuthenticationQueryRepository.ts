import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import { UserId } from "@one-kilo/domain/ids/UserId"
import { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import * as S from "effect/Schema"

type FindUserIdAndWorkspaceIdParameters = {
  workosUserId: WorkOSIds.UserId
  workosOrganizationId: WorkOSIds.OrganizationId
}

export class AuthenticationQueryRepository extends Effect.Service<AuthenticationQueryRepository>()(
  "@one-kilo/sql/AuthenticationQueryRepository",
  {
    dependencies: [],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient

      const findUserIdAndWorkspaceIdSchema = SqlSchema.findOne({
        Request: S.Struct({ workosUserId: WorkOSIds.UserId, workosOrganizationId: WorkOSIds.OrganizationId }),
        Result: S.Struct({ userId: UserId, workspaceId: WorkspaceId }),
        execute: ({ workosUserId, workosOrganizationId }) =>
          sql`
            SELECT u.id AS user_id, ws.id AS workspace_id
            FROM users u
            JOIN workspace_memberships wsm ON wsm.user_id = u.id
            JOIN workspaces ws ON ws.id = wsm.workspace_id
            WHERE u.workos_user_id = ${workosUserId}
              AND ws.workos_organization_id = ${workosOrganizationId}
              AND u.archived_at IS NULL
              AND wsm.archived_at IS NULL
              AND ws.archived_at IS NULL
          `
      })

      const findUserIdAndWorkspaceId = Effect.fn(
        "AuthenticationQueryRepository.findUserIdAndWorkspaceId"
      )(
        function*(parameters: FindUserIdAndWorkspaceIdParameters) {
          return yield* findUserIdAndWorkspaceIdSchema(parameters)
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding user and workspace for authentication")
      )

      return { findUserIdAndWorkspaceId }
    })
  }
) {}
