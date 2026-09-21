import { WorkspacesQueryRepository } from "@one-kilo/sql/modules/workspaces/WorkspacesQueryRepository"
import * as Effect from "effect/Effect"

export class WorkspacesQueryModule extends Effect.Service<WorkspacesQueryModule>()(
  "@one-kilo/core/WorkspacesQueryModule",
  {
    dependencies: [WorkspacesQueryRepository.Default],
    effect: Effect.gen(function*() {
      const workspacesQueryRepository = yield* WorkspacesQueryRepository

      return {
        retrieveWorkspaceEntity: workspacesQueryRepository.findWorkspaceEntityById
      }
    })
  }
) {}
