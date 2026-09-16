import type * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import type { AccountId } from "@one-kilo/domain/ids/AccountId"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import type { WorkspaceName, WorkspaceType } from "@one-kilo/domain/values/WorkspaceValues"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { WorkspacesModel } from "./WorkspacesModel.ts"

type InsertWorkspaceParameters = {
  performedByAccountId: AccountId
  name: WorkspaceName
  type: WorkspaceType
  workosOrganizationId: WorkOSIds.OrganizationId

  id?: WorkspaceId
}

export class WorkspacesRepository extends Effect.Service<WorkspacesRepository>()(
  "@one-kilo/sql/WorkspacesRepository",
  {
    dependencies: [DomainIdGenerator.Default],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      const idGenerator = yield* DomainIdGenerator

      const insertSchema = SqlSchema.single({
        Request: WorkspacesModel.insert,
        Result: WorkspacesModel.select,
        execute: (request) => sql`INSERT INTO workspaces ${sql.insert(request).returning("*")}`
      })
      const insert = Effect.fn("WorkspacesRepository.insert")(
        function*({
          name,
          type,
          workosOrganizationId,
          id,
          performedByAccountId
        }: InsertWorkspaceParameters) {
          const workspaceIdEffect = id
            ? Effect.succeed(id)
            : idGenerator.workspaceId

          return yield* Effect.flatMap(
            workspaceIdEffect,
            (workspaceId) =>
              insertSchema({
                id: workspaceId,
                name,
                type,
                workosOrganizationId,
                createdAt: undefined,
                createdByAccountId: performedByAccountId,
                updatedAt: undefined,
                updatedByAccountId: performedByAccountId,
                archivedAt: undefined
              })
          )
        },
        orDieWithUnexpectedError("Failed to insert workspace")
      )

      return { insert }
    })
  }
) {}
