import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import type { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import type { WorkspaceMembershipId } from "@one-kilo/domain/ids/WorkspaceMembershipId"
import { WorkspaceMembershipsRepository } from "@one-kilo/sql/modules/workspaces/WorkspaceMembershipsRepository"
import { WorkspacesRepository } from "@one-kilo/sql/modules/workspaces/WorkspacesRepository"
import * as Effect from "effect/Effect"

type AddUserToPersonalWorkspaceParameters = {
  id: WorkspaceMembershipId
  userId: UserId
  workspaceId: WorkspaceId
}

type CreateWorkspaceParameters = {
  id: WorkspaceId
  name: string
  performedByUserId: UserId
  workosOrganizationId: WorkOSIds.OrganizationId
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

      const addUserToPersonalWorkspace = Effect.fn("WorkspacesCreationModule.addUserToPersonalWorkspace")(
        function*({
          id,
          userId,
          workspaceId
        }: AddUserToPersonalWorkspaceParameters) {
          // TODO: This is more of an "ensure" operation - needs to be refactored so it could be called twice

          const workspaceMembership = yield* workspaceMembershipsRepository.insert({
            id,
            userId,
            workspaceId,
            role: "OWNER"
          })

          // Record addition event

          return workspaceMembership
        }
      )

      // TODO: Refactor this to create a personal workspace. This would be more cohesive business logic
      const createWorkspace = Effect.fn("WorkspacesCreationModule.createWorkspace")(
        function*({
          id,
          name,
          performedByUserId,
          workosOrganizationId
        }: CreateWorkspaceParameters) {
          const workspace = yield* workspacesRepository.insert({
            id,
            name,
            type: "PERSONAL",
            workosOrganizationId,
            performedByUserId
          })

          // Record creation event

          return workspace
        }
      )

      return {
        addUserToPersonalWorkspace,
        createWorkspace
      }
    })
  }
) {}
