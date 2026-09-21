import type { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import { dieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import { WorkspacesQueryRepository } from "@one-kilo/sql/modules/workspaces/WorkspacesQueryRepository"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"

type RetrieveWorkspaceEntityParameters = {
  readonly workspaceId: WorkspaceId
}

export class WorkspacesQueryModule extends Effect.Service<WorkspacesQueryModule>()(
  "@one-kilo/core/WorkspacesQueryModule",
  {
    dependencies: [WorkspacesQueryRepository.Default],
    effect: Effect.gen(function*() {
      const workspacesQueryRepository = yield* WorkspacesQueryRepository

      const retrieveWorkspaceEntity = workspacesQueryRepository.findWorkspaceEntityById

      const retrieveWorkspaceEntityOrDie = Effect.fn("WorkspacesQueryModule.retrieveWorkspaceEntityOrDie")(
        function*({ workspaceId }: RetrieveWorkspaceEntityParameters) {
          return yield* pipe(
            retrieveWorkspaceEntity({ workspaceId }),
            Effect.flatMap(
              Option.match({
                onNone: () =>
                  dieWithUnexpectedError("Expected a workspace to exist but none was found", { workspaceId }),
                onSome: Effect.succeed
              })
            )
          )
        }
      )

      return {
        retrieveWorkspaceEntity,
        retrieveWorkspaceEntityOrDie
      }
    })
  }
) {}
