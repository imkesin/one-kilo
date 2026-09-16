import { AuthenticationHeaders } from "@one-kilo/server-api/infra/AuthenticationSecurity"
import * as Effect from "effect/Effect"
import { ApplicationServerApiClient } from "~/infra/api/server/ServerApiClients"
import { AuthenticationWebModule } from "~/modules/authentication/server/AuthenticationWebModule"

export class AccountsWebProxy extends Effect.Service<AccountsWebProxy>()(
  "@one-kilo/web/AccountsWebProxy",
  {
    dependencies: [
      ApplicationServerApiClient.Default,
      AuthenticationWebModule.Default
    ],
    effect: Effect.gen(function*() {
      const applicationClient = yield* ApplicationServerApiClient
      const authentication = yield* AuthenticationWebModule

      const me = Effect.fn("AccountsWebProxy.me")(function*() {
        const { workosAccessToken } = yield* authentication.currentAuthenticationContext

        return yield* applicationClient.accounts.me({
          headers: AuthenticationHeaders.fromAccessToken(workosAccessToken)
        })
      })

      return { me }
    })
  }
) {}
