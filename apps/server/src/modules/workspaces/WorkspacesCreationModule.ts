import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import type { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import type { WorkspaceMembershipId } from "@one-kilo/domain/ids/WorkspaceMembershipId"
import { WorkspaceName } from "@one-kilo/domain/values/WorkspaceValues"
import { WorkspaceMembershipsRepository } from "@one-kilo/sql/modules/workspaces/WorkspaceMembershipsRepository"
import { WorkspacesRepository } from "@one-kilo/sql/modules/workspaces/WorkspacesRepository"
import * as Effect from "effect/Effect"

type CreatePersonalWorkspaceParameters = {
  id: WorkspaceId
  workosOrganizationId: WorkOSIds.OrganizationId

  userId: UserId
  workspaceMembershipParameters: {
    id: WorkspaceMembershipId
    workosOrganizationMembershipId: WorkOSIds.OrganizationMembershipId
  }
}

export class WorkspacesCreationModule extends Effect.Service<WorkspacesCreationModule>()(
  "@one-kilo/server/WorkspacesCreationModule",
  {
    dependencies: [
      WorkspaceMembershipsRepository.Default,
      WorkspacesRepository.Default
    ],
    effect: Effect.gen(function*() {
      const workspaceMembershipsRepository = yield* WorkspaceMembershipsRepository
      const workspacesRepository = yield* WorkspacesRepository

      const createPersonalWorkspace = Effect.fn("WorkspacesCreationModule.createPersonalWorkspace")(
        function*({
          id,
          workosOrganizationId,
          userId,
          workspaceMembershipParameters
        }: CreatePersonalWorkspaceParameters) {
          // TODO: Enforce invariants before creation

          const workspace = yield* workspacesRepository.insert({
            id,
            name: WorkspaceName.make("Personal"),
            type: "PERSONAL",
            workosOrganizationId,
            performedByUserId: userId
          })

          const workspaceMembership = yield* workspaceMembershipsRepository.insert({
            id: workspaceMembershipParameters.id,
            userId,
            workspaceId: workspace.id,
            role: "OWNER",
            workosOrganizationMembershipId: workspaceMembershipParameters.workosOrganizationMembershipId
          })

          return { workspace, workspaceMembership }
        }
      )

      return { createPersonalWorkspace }
    })
  }
) {}
