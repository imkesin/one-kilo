import type * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import type { AccountId } from "@one-kilo/domain/ids/AccountId"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import type { WorkspaceMembershipId } from "@one-kilo/domain/ids/WorkspaceMembershipId"
import type { WorkspaceMembershipRole } from "@one-kilo/domain/values/WorkspaceMembershipValues"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { WorkspaceMembershipsModel } from "./WorkspaceMembershipsModel.ts"

type InsertWorkspaceMembershipParameters = {
  accountId: AccountId
  workspaceId: WorkspaceId
  role: WorkspaceMembershipRole
  workosOrganizationMembershipId: WorkOSIds.OrganizationMembershipId

  id?: WorkspaceMembershipId
  performedByAccountId?: AccountId
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
          accountId,
          workspaceId,
          role,
          workosOrganizationMembershipId,
          id,
          performedByAccountId
        }: InsertWorkspaceMembershipParameters) {
          const membershipIdEffect = id
            ? Effect.succeed(id)
            : idGenerator.workspaceMembershipId

          return yield* Effect.flatMap(
            membershipIdEffect,
            (membershipId) =>
              insertSchema({
                id: membershipId,
                accountId,
                workspaceId,
                role,
                workosOrganizationMembershipId,
                createdAt: undefined,
                createdByAccountId: performedByAccountId ?? accountId,
                updatedAt: undefined,
                updatedByAccountId: performedByAccountId ?? accountId,
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
