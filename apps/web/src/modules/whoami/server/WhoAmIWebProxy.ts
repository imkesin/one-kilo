import { AuthenticationHeaders } from "@one-kilo/server-api/infra/AuthenticationSecurity"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { ApplicationServerApiClient } from "~/infra/api/server/ServerApiClients"
import { AuthenticationWebModule } from "~/modules/authentication/server/AuthenticationWebModule"

export class WhoAmIWebProxy extends Context.Service<WhoAmIWebProxy>()(
  "@one-kilo/web/WhoAmIWebProxy",
  {
    make: Effect.gen(function*() {
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
) {
  static readonly layer = pipe(
    Layer.effect(this, this.make),
    Layer.provide([
      ApplicationServerApiClient.layer,
      AuthenticationWebModule.layer
    ])
  )
}
