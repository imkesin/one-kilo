import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import { AccountsQueryModule } from "@one-kilo/core/modules/accounts/AccountsQueryModule"
import { WorkspacesQueryModule } from "@one-kilo/core/modules/workspaces/WorkspacesQueryModule"
import { Actor } from "@one-kilo/domain/tags/Actor"
import { dieWithUnexpectedErrorCallback } from "@one-kilo/lib/errors/UnexpectedError"
import { WhoAmIApiSchemas } from "@one-kilo/server-api/modules/whoami/WhoAmIApiSchemas"
import { ServerApi } from "@one-kilo/server-api/ServerApi"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"

export const WhoAmIHttp = pipe(
  HttpApiBuilder.group(
    ServerApi,
    "whoami",
    Effect.fn(function*(handlers) {
      const accountsQueryModule = yield* AccountsQueryModule
      const workspacesQueryModule = yield* WorkspacesQueryModule

      return handlers
        .handle(
          "whoami",
          Effect.fn(function*() {
            const actor = yield* Actor

            const [account, workspace] = yield* Effect.all(
              [
                pipe(
                  accountsQueryModule.retrieveAccount({ accountId: actor.account.id }),
                  Effect.andThen(
                    Option.match({
                      onNone: dieWithUnexpectedErrorCallback("Failed to retrieve the authenticated account"),
                      onSome: Effect.succeed
                    })
                  )
                ),
                pipe(
                  workspacesQueryModule.retrieveWorkspaceEntity({ workspaceId: actor.workspace.id }),
                  Effect.andThen(
                    Option.match({
                      onNone: dieWithUnexpectedErrorCallback("Failed to retrieve the in-scope workspace"),
                      onSome: Effect.succeed
                    })
                  )
                )
              ],
              { concurrency: "unbounded" }
            )

            return WhoAmIApiSchemas.Success.fromDomain({ account, workspace })
          })
        )
    })
  ),
  Layer.provide([
    AccountsQueryModule.Default,
    WorkspacesQueryModule.Default
  ])
)
