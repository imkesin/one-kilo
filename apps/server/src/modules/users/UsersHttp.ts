import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import { UsersQueryModule } from "@one-kilo/core/modules/users/UsersQueryModule"
import { Actor } from "@one-kilo/domain/tags/Actor"
import { dieWithUnexpectedErrorCallback } from "@one-kilo/lib/errors/UnexpectedError"
import { UsersApi_MeSchemas } from "@one-kilo/server-api/modules/users/UsersApiSchemas"
import { ServerApi } from "@one-kilo/server-api/ServerApi"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"

export const UsersHttp = pipe(
  HttpApiBuilder.group(
    ServerApi,
    "users",
    Effect.fn(function*(handlers) {
      const usersQueryModule = yield* UsersQueryModule

      return handlers
        .handle(
          "me",
          Effect.fn(function*() {
            const actor = yield* Actor

            const user = yield* pipe(
              usersQueryModule.retrieveUser({ userId: actor.user.id }),
              Effect.andThen(
                Option.match({
                  onNone: dieWithUnexpectedErrorCallback("Failed to retrieve an authenticated user"),
                  onSome: Effect.succeed
                })
              )
            )

            return UsersApi_MeSchemas.Success.fromDomain(user)
          })
        )
    })
  ),
  Layer.provide(UsersQueryModule.Default)
)
