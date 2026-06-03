import { AuthenticationHeaders } from "@one-kilo/server-api/infra/AuthenticationSecurity"
import * as Effect from "effect/Effect"
import { ApplicationServerApiClient } from "~/infra/api/server/ServerApiClients"
import { AuthenticationWebModule } from "~/modules/authentication/server/AuthenticationWebModule"

export class UsersWebProxy extends Effect.Service<UsersWebProxy>()(
  "@one-kilo/web/UsersWebProxy",
  {
    dependencies: [
      ApplicationServerApiClient.Default,
      AuthenticationWebModule.Default
    ],
    effect: Effect.gen(function*() {
      const applicationClient = yield* ApplicationServerApiClient
      const authentication = yield* AuthenticationWebModule

      const me = Effect.fn("UsersWebProxy.me")(function*() {
        const { workosAccessToken } = yield* authentication.currentAuthenticationContext

        return yield* applicationClient.users.me({
          headers: AuthenticationHeaders.fromAccessToken(workosAccessToken)
        })
      })

      return { me }
    })
  }
) {}
