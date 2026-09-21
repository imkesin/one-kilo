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

      /**
       * For callers that have already established the workspace exists (e.g. it is the actor's
       * in-scope workspace). A missing row is an invariant violation, so the whole flow dies.
       */
      const retrieveWorkspaceEntityOrDie = Effect.fn("WorkspacesQueryModule.retrieveWorkspaceEntityOrDie")(
        function*({ workspaceId }: RetrieveWorkspaceEntityParameters) {
          return yield* pipe(
            workspacesQueryRepository.findWorkspaceEntityById({ workspaceId }),
            Effect.flatMap(
              Option.match({
                onNone: () => dieWithUnexpectedError("Expected a workspace to exist but none was found"),
                onSome: Effect.succeed
              })
            ),
            Effect.annotateLogs({ workspaceId })
          )
        }
      )

      return {
        retrieveWorkspaceEntity: workspacesQueryRepository.findWorkspaceEntityById,
        retrieveWorkspaceEntityOrDie
      }
    })
  }
) {}
