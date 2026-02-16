import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import { WorkspaceEntity } from "@one-kilo/domain/entities/Workspace"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import { WorkspacesModel } from "./WorkspacesModel.ts"

type FindWorkspaceEntityByWorkOSOrganizationIdParameters = {
  workosOrganizationId: WorkOSIds.OrganizationId
}

export class WorkspacesQueryRepository extends Effect.Service<WorkspacesQueryRepository>()(
  "@one-kilo/sql/WorkspacesQueryRepository",
  {
    dependencies: [],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient

      const findWorkspaceEntityByWorkOSOrganizationIdSchema = SqlSchema.findOne({
        Request: WorkOSIds.OrganizationId,
        Result: WorkspacesModel.select,
        execute: (workosOrganizationId) =>
          sql`
            SELECT *
            FROM workspaces
            WHERE workos_organization_id = ${workosOrganizationId}
          `
      })
      const findWorkspaceEntityByWorkOSOrganizationId = Effect.fn(
        "UsersQueryRepository.findWorkspaceEntityByWorkOSOrganizationId"
      )(
        function*({ workosOrganizationId }: FindWorkspaceEntityByWorkOSOrganizationIdParameters) {
          return yield* Effect.map(
            findWorkspaceEntityByWorkOSOrganizationIdSchema(workosOrganizationId),
            Option.map((_) => WorkspaceEntity.make(_))
          )
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding a workspace")
      )

      return { findWorkspaceEntityByWorkOSOrganizationId }
    })
  }
) {}
