import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import { WorkspaceEntity } from "@one-kilo/domain/entities/Workspace"
import { AccountId } from "@one-kilo/domain/ids/AccountId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import * as S from "effect/Schema"
import * as WorkspaceMembershipsTransformations from "./internal/WorkspaceMembershipsTransformations.ts"
import { WorkspaceMembershipsModel } from "./WorkspaceMembershipsModel.ts"
import { WorkspacesModel } from "./WorkspacesModel.ts"

type FindPersonalWorkspaceAndMembershipEntityByAccountIdParameters = {
  accountId: AccountId
}
type FindWorkspaceEntityByWorkOSOrganizationIdParameters = {
  workosOrganizationId: WorkOSIds.OrganizationId
}

export class WorkspacesQueryRepository extends Effect.Service<WorkspacesQueryRepository>()(
  "@one-kilo/sql/WorkspacesQueryRepository",
  {
    dependencies: [],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient

      const findPersonalWorkspaceAndMembershipEntitiesByAccountIdSchema = SqlSchema.findOne({
        Request: AccountId,
        Result: S.extend(
          WorkspacesModel.select,
          S.Struct({ workspaceMemberships: S.Tuple(WorkspaceMembershipsModel.select) })
        ),
        execute: (accountId) =>
          sql`
            SELECT
              ws.*,
              JSON_AGG(${sql.unsafe(WorkspaceMembershipsModel.asJsonBBuildObject())}) AS workspaceMemberships
            FROM workspaces ws
            JOIN workspace_memberships wsm ON wsm.workspace_id = ws.id
            WHERE
              ws.type = 'Personal'
              AND ws.archived_at IS NULL
              AND wsm.account_id = ${accountId}
              AND wsm.archived_at IS NULL
            GROUP BY ws.id
            LIMIT 1
          `
      })
      const findPersonalWorkspaceAndMembershipEntitiesByAccountId = Effect.fn(
        "WorkspacesQueryRepository.findPersonalWorkspaceAndMembershipEntitiesByAccountId"
      )(
        function*({ accountId }: FindPersonalWorkspaceAndMembershipEntityByAccountIdParameters) {
          return yield* Effect.map(
            findPersonalWorkspaceAndMembershipEntitiesByAccountIdSchema(accountId),
            Option.map(({ workspaceMemberships: [workspaceMembership], ...workspace }) => ({
              workspace: WorkspaceEntity.make(workspace),
              workspaceMembership: WorkspaceMembershipsTransformations.toWorkspaceMembershipEntity(workspaceMembership)
            }))
          )
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding a workspace")
      )

      const findWorkspaceEntityByWorkOSOrganizationIdSchema = SqlSchema.findOne({
        Request: WorkOSIds.OrganizationId,
        Result: WorkspacesModel.select,
        execute: (workosOrganizationId) =>
          sql`
            SELECT *
            FROM workspaces ws
            WHERE
              ws.workos_organization_id = ${workosOrganizationId}
              AND ws.archived_at IS NULL
            LIMIT 1
          `
      })
      const findWorkspaceEntityByWorkOSOrganizationId = Effect.fn(
        "AccountsQueryRepository.findWorkspaceEntityByWorkOSOrganizationId"
      )(
        function*({ workosOrganizationId }: FindWorkspaceEntityByWorkOSOrganizationIdParameters) {
          return yield* Effect.map(
            findWorkspaceEntityByWorkOSOrganizationIdSchema(workosOrganizationId),
            Option.map((_) => WorkspaceEntity.make(_))
          )
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding a workspace")
      )

      return {
        findPersonalWorkspaceAndMembershipEntitiesByAccountId,
        findWorkspaceEntityByWorkOSOrganizationId
      }
    })
  }
) {}
