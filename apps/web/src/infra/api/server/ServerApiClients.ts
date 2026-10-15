import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import { ApplicationApi, AuthenticationApi } from "@one-kilo/server-api/ServerApi"
import * as Config from "effect/Config"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as HttpApiClient from "effect/http-api/HttpApiClient"
import * as Layer from "effect/Layer"

const ServerInternalBaseUrlConfig = pipe(
  Config.URL("SERVER_INTERNAL_BASE_URL"),
  Config.withDefault(new URL("http://localhost:10000")),
  Config.map((url) => url.origin)
)

export class AuthenticationServerApiClient extends Context.Service<AuthenticationServerApiClient>()(
  "@one-kilo/web/ServerApiClient:Authentication",
  {
    make: Effect.gen(function*() {
      const serverBaseUrl = yield* ServerInternalBaseUrlConfig

      return yield* HttpApiClient.make(AuthenticationApi, { baseUrl: serverBaseUrl })
    })
  }
) {
  static readonly layer = pipe(
    Layer.effect(this, this.make),
    Layer.provide(NodeHttpClient.layerUndici)
  )
}

export class ApplicationServerApiClient extends Context.Service<ApplicationServerApiClient>()(
  "@one-kilo/web/ServerApiClient:Application",
  {
    make: Effect.gen(function*() {
      const serverBaseUrl = yield* ServerInternalBaseUrlConfig

      return yield* HttpApiClient.make(ApplicationApi, { baseUrl: serverBaseUrl })
    })
  }
) {
  static readonly layer = pipe(
    Layer.effect(this, this.make),
    Layer.provide(NodeHttpClient.layerUndici)
  )
}
