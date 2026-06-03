import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { WebApi } from "~/infra/api/WebApi"
import { UsersWebProxy } from "~/modules/users/server/UsersWebProxy"
import { Users_UnauthenticatedError } from "./UsersWebApiErrors"

const unauthenticated = () => Effect.fail(new Users_UnauthenticatedError())

export const UsersWebHttp = pipe(
  HttpApiBuilder.group(
    WebApi,
    "users",
    (handlers) =>
      handlers.handle("me", () =>
        pipe(
          Effect.flatMap(UsersWebProxy, (proxy) => proxy.me()),
          /*
           * TODO: Better error handling
           */
          Effect.catchTags({
            "Authentication:ContextCookieNotFoundError": unauthenticated,
            "Authentication:ContextExpiredError": unauthenticated,
            "UnauthenticatedError": unauthenticated
          }),
          Effect.catchAll((error) =>
            error instanceof Users_UnauthenticatedError
              ? Effect.fail(error)
              : Effect.andThen(
                Effect.logError("Failed to proxy GET /users/me to the application server", error),
                Effect.die(error)
              )
          )
        ))
  ),
  Layer.provide(UsersWebProxy.Default)
)
