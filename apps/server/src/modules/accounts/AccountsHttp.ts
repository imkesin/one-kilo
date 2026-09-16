import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import { AccountsQueryModule } from "@one-kilo/core/modules/accounts/AccountsQueryModule"
import { Actor } from "@one-kilo/domain/tags/Actor"
import { dieWithUnexpectedErrorCallback } from "@one-kilo/lib/errors/UnexpectedError"
import { AccountsApi_MeSchemas } from "@one-kilo/server-api/modules/accounts/AccountsApiSchemas"
import { ServerApi } from "@one-kilo/server-api/ServerApi"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"

export const AccountsHttp = pipe(
  HttpApiBuilder.group(
    ServerApi,
    "accounts",
    Effect.fn(function*(handlers) {
      const accountsQueryModule = yield* AccountsQueryModule

      return handlers
        .handle(
          "me",
          Effect.fn(function*() {
            const actor = yield* Actor

            const account = yield* pipe(
              accountsQueryModule.retrieveAccount({ accountId: actor.account.id }),
              Effect.andThen(
                Option.match({
                  onNone: dieWithUnexpectedErrorCallback("Failed to retrieve an authenticated account"),
                  onSome: Effect.succeed
                })
              )
            )

            return AccountsApi_MeSchemas.Success.fromDomain(account)
          })
        )
    })
  ),
  Layer.provide(AccountsQueryModule.Default)
)
