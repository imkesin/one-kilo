import { AuthenticationHeaders } from "@one-kilo/server-api/infra/AuthenticationSecurity"
import * as Effect from "effect/Effect"
import { ApplicationServerApiClient } from "~/infra/api/server/ServerApiClients"
import { AuthenticationWebModule } from "~/modules/authentication/server/AuthenticationWebModule"

export class WhoAmIWebProxy extends Effect.Service<WhoAmIWebProxy>()(
  "@one-kilo/web/WhoAmIWebProxy",
  {
    dependencies: [
      ApplicationServerApiClient.Default,
      AuthenticationWebModule.Default
    ],
    effect: Effect.gen(function*() {
      const applicationClient = yield* ApplicationServerApiClient
      const authentication = yield* AuthenticationWebModule

      const whoami = Effect.fn("WhoAmIWebProxy.whoami")(function*() {
        const { workosAccessToken } = yield* authentication.currentAuthenticationContext

        return yield* applicationClient.whoami({
          headers: AuthenticationHeaders.fromAccessToken(workosAccessToken)
        })
      })

      return { whoami }
    })
  }
) {}
