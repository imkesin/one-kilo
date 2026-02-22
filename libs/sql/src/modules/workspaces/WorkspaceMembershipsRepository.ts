import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import { UserId } from "@one-kilo/domain/ids/UserId"
import { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import { WorkspaceMembershipId } from "@one-kilo/domain/ids/WorkspaceMembershipId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { WorkspaceMembershipsModel } from "./WorkspaceMembershipsModel.ts"

type InsertWorkspaceMembershipParameters = {
  userId: UserId
  workspaceId: WorkspaceId

  id?: WorkspaceMembershipId
  performedByUserId?: UserId
}

export class WorkspaceMembershipsRepository extends Effect.Service<WorkspaceMembershipsRepository>()(
  "@one-kilo/sql/WorkspaceMembershipsRepository",
  {
    dependencies: [DomainIdGenerator.Default],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      const idGenerator = yield* DomainIdGenerator

      const insertSchema = SqlSchema.single({
        Request: WorkspaceMembershipsModel.insert,
        Result: WorkspaceMembershipsModel.select,
        execute: (request) => sql`INSERT INTO workspace_memberships ${sql.insert(request).returning("*")}`
      })
      const insert = Effect.fn("WorkspaceMembershipsRepository.insert")(
        function*({
          userId,
          workspaceId,
          id,
          performedByUserId
        }: InsertWorkspaceMembershipParameters) {
          const membershipIdEffect = id
            ? Effect.succeed(id)
            : idGenerator.workspaceMembershipId

          return yield* Effect.flatMap(
            membershipIdEffect,
            (membershipId) =>
              insertSchema({
                id: membershipId,
                userId,
                workspaceId,
                createdAt: undefined,
                createdByUserId: performedByUserId ?? userId,
                updatedAt: undefined,
                updatedByUserId: performedByUserId ?? userId,
                archivedAt: undefined
              })
          )
        },
        orDieWithUnexpectedError("Failed to insert workspace membership")
      )

      return { insert }
    })
  }
) {}
