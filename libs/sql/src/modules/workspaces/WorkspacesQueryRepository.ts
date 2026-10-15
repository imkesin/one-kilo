import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { WorkspaceEntity } from "@one-kilo/domain/entities/Workspace"
import { AccountId } from "@one-kilo/domain/ids/AccountId"
import { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as S from "effect/Schema"
import * as SqlClient from "effect/sql/SqlClient"
import * as SqlSchema from "effect/sql/SqlSchema"
import * as WorkspaceMembershipsTransformations from "./internal/WorkspaceMembershipsTransformations.ts"
import { WorkspaceMembershipsModel } from "./WorkspaceMembershipsModel.ts"
import { WorkspacesModel } from "./WorkspacesModel.ts"

type FindPersonalWorkspaceAndMembershipEntityByAccountIdParameters = {
  accountId: AccountId
}
type FindWorkspaceEntityByIdParameters = {
  workspaceId: WorkspaceId
}
type FindWorkspaceEntityByWorkOSOrganizationIdParameters = {
  workosOrganizationId: WorkOSIds.OrganizationId
}

export class WorkspacesQueryRepository extends Context.Service<WorkspacesQueryRepository>()(
  "@one-kilo/sql/WorkspacesQueryRepository",
  {
    make: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient

      const findPersonalWorkspaceAndMembershipEntitiesByAccountIdSchema = SqlSchema.findOneOption({
        Request: AccountId,
        Result: S.Struct({
          ...WorkspacesModel.select.fields,
          workspaceMemberships: S.Tuple([WorkspaceMembershipsModel.select])
        }),
        execute: (accountId) =>
          sql`
            SELECT
              workspaces.*,
              JSON_AGG(${sql.unsafe(WorkspaceMembershipsModel.asJsonBBuildObject())}) AS workspaceMemberships
            FROM workspaces
            JOIN workspace_memberships ON workspace_memberships.workspace_id = workspaces.id
            WHERE
              workspaces.type = 'Personal'
              AND workspaces.archived_at IS NULL
              AND workspace_memberships.account_id = ${accountId}
              AND workspace_memberships.archived_at IS NULL
            GROUP BY workspaces.id
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

      const findWorkspaceEntityByIdSchema = SqlSchema.findOneOption({
        Request: WorkspaceId,
        Result: WorkspacesModel.select,
        execute: (workspaceId) =>
          sql`
            SELECT *
            FROM workspaces
            WHERE
              workspaces.id = ${workspaceId}
              AND workspaces.archived_at IS NULL
            LIMIT 1
          `
      })
      const findWorkspaceEntityById = Effect.fn("WorkspacesQueryRepository.findWorkspaceEntityById")(
        function*({ workspaceId }: FindWorkspaceEntityByIdParameters) {
          return yield* Effect.map(
            findWorkspaceEntityByIdSchema(workspaceId),
            Option.map((_) => WorkspaceEntity.make(_))
          )
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding a workspace")
      )

      const findWorkspaceEntityByWorkOSOrganizationIdSchema = SqlSchema.findOneOption({
        Request: WorkOSIds.OrganizationId,
        Result: WorkspacesModel.select,
        execute: (workosOrganizationId) =>
          sql`
            SELECT *
            FROM workspaces
            WHERE
              workspaces.workos_organization_id = ${workosOrganizationId}
              AND workspaces.archived_at IS NULL
            LIMIT 1
          `
      })
      const findWorkspaceEntityByWorkOSOrganizationId = Effect.fn(
        "WorkspacesQueryRepository.findWorkspaceEntityByWorkOSOrganizationId"
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
        findWorkspaceEntityById,
        findWorkspaceEntityByWorkOSOrganizationId
      }
    })
  }
) {
  static readonly layer = Layer.effect(this, this.make)
}
