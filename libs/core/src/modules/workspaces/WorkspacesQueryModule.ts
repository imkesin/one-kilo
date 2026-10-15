import type { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import { dieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import { WorkspacesQueryRepository } from "@one-kilo/sql/modules/workspaces/WorkspacesQueryRepository"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"

type RetrieveWorkspaceEntityParameters = {
  readonly workspaceId: WorkspaceId
}

export class WorkspacesQueryModule extends Context.Service<WorkspacesQueryModule>()(
  "@one-kilo/core/WorkspacesQueryModule",
  {
    make: Effect.gen(function*() {
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
) {
  static readonly layer = pipe(
    Layer.effect(this, this.make),
    Layer.provide(WorkspacesQueryRepository.layer)
  )
}
