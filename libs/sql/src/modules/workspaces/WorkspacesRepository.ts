import type * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import type { AccountId } from "@one-kilo/domain/ids/AccountId"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import type { WorkspaceName, WorkspaceType } from "@one-kilo/domain/values/WorkspaceValues"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as SqlClient from "effect/sql/SqlClient"
import * as SqlSchemaExtensions from "../../utils/SqlSchemaExtensions.ts"
import { WorkspacesModel } from "./WorkspacesModel.ts"

type InsertWorkspaceParameters = {
  performedByAccountId: AccountId
  name: WorkspaceName
  type: WorkspaceType
  workosOrganizationId: WorkOSIds.OrganizationId

  id?: WorkspaceId
}

export class WorkspacesRepository extends Context.Service<WorkspacesRepository>()(
  "@one-kilo/sql/WorkspacesRepository",
  {
    make: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      const idGenerator = yield* DomainIdGenerator

      const insertSchema = SqlSchemaExtensions.findOneWithRequestDefaults({
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
) {
  static readonly layer = pipe(
    Layer.effect(this, this.make),
    Layer.provide(DomainIdGenerator.layer)
  )
}
