import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import type { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import { WorkspacesRepository } from "@one-kilo/sql/modules/workspaces/WorkspacesRepository"
import * as Effect from "effect/Effect"

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
      WorkspacesRepository.Default
    ],
    effect: Effect.gen(function*() {
      const workspacesRepository = yield* WorkspacesRepository

      const createWorkspace = Effect.fn(
        function*({
          id,
          name,
          performedByUserId,
          workosOrganizationId
        }: CreateWorkspaceParameters) {
          const workspace = yield* workspacesRepository.insert({
            id,
            name,
            workosOrganizationId,
            performedByUserId
          })

          // Record creation event

          return workspace
        }
      )

      return { createWorkspace }
    })
  }
) {}
