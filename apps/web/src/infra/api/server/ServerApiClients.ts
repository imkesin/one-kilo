import "server-only"

import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import * as HttpApiClient from "@effect/platform/HttpApiClient"
import { ApplicationApi, AuthenticationApi } from "@one-kilo/server-api/ServerApi"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"

export class AuthenticationServerApiClient extends Effect.Service<AuthenticationServerApiClient>()(
  "@one-kilo/web/ServerApiClient:Authentication",
  {
    dependencies: [NodeHttpClient.layerUndici],
    effect: Effect.gen(function*() {
      const serverBaseUrl = yield* pipe(
        Config.string("SERVER_BASE_URL"),
        Config.withDefault("http://localhost:10000")
      )

      return yield* HttpApiClient.make(AuthenticationApi, { baseUrl: serverBaseUrl })
    })
  }
) {}

export class ApplicationServerApiClient extends Effect.Service<ApplicationServerApiClient>()(
  "@one-kilo/web/ServerApiClient:Application",
  {
    dependencies: [NodeHttpClient.layerUndici],
    effect: Effect.gen(function*() {
      const serverBaseUrl = yield* pipe(
        Config.string("SERVER_BASE_URL"),
        Config.withDefault("http://localhost:10000")
      )

      return yield* HttpApiClient.make(ApplicationApi, { baseUrl: serverBaseUrl })
    })
  }
) {}
