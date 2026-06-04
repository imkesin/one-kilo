import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import { AuthenticationHeaders } from "@one-kilo/server-api/infra/AuthenticationSecurity"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { ApplicationServerApiClient } from "~/infra/api/server/ServerApiClients"
import { WebActor } from "~/infra/api/WebActor"
import { WebApi } from "~/infra/api/WebApi"
import { WebUnauthenticatedError } from "~/infra/api/WebApiErrors"

export const UsersWebHttp = pipe(
  HttpApiBuilder.group(
    WebApi,
    "users",
    Effect.fn(function*(handlers) {
      const applicationClient = yield* ApplicationServerApiClient

      return handlers.handle("me", () =>
        Effect.gen(function*() {
          const { workosAccessToken } = yield* WebActor

          return yield* pipe(
            applicationClient.users.me({ headers: AuthenticationHeaders.fromAccessToken(workosAccessToken) }),
            Effect.catchTag("UnauthenticatedError", () => Effect.fail(new WebUnauthenticatedError())),
            orDieWithUnexpectedError("proxy GET /users/me")
          )
        }))
    })
  ),
  Layer.provide(ApplicationServerApiClient.Default)
)
