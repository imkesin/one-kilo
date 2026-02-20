import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import { UserId } from "@one-kilo/domain/ids/UserId"
import { WorkspaceId, WorkspaceIdGenerator } from "@one-kilo/domain/ids/WorkspaceId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { WorkspacesModel } from "./WorkspacesModel.ts"

type InsertWorkspaceParameters = {
  name: string
  workosOrganizationId: WorkOSIds.OrganizationId
  performedByUserId: UserId

  id?: WorkspaceId
}

export class WorkspacesRepository extends Effect.Service<WorkspacesRepository>()(
  "@one-kilo/sql/WorkspacesRepository",
  {
    dependencies: [WorkspaceIdGenerator.Default],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      const workspaceIdGenerator = yield* WorkspaceIdGenerator

      const insertSchema = SqlSchema.single({
        Request: WorkspacesModel.insert,
        Result: WorkspacesModel.select,
        execute: (request) => sql`INSERT INTO workspaces ${sql.insert(request).returning("*")}`
      })
      const insert = Effect.fn("WorkspacesRepository.insert")(
        function*({
          name,
          workosOrganizationId,
          id,
          performedByUserId
        }: InsertWorkspaceParameters) {
          const workspaceIdEffect = id
            ? Effect.succeed(id)
            : workspaceIdGenerator.generate

          return yield* Effect.flatMap(
            workspaceIdEffect,
            (workspaceId) =>
              insertSchema({
                id: workspaceId,
                name,
                workosOrganizationId,
                createdAt: undefined,
                createdByUserId: performedByUserId,
                updatedAt: undefined,
                updatedByUserId: performedByUserId,
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
