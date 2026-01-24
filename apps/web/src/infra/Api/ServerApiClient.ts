import { HttpApi, HttpApiClient } from "@effect/platform"
import { NodeHttpClient } from "@effect/platform-node"
import * as Effect from "effect/Effect"
import * as Config from "effect/Config"
import { pipe } from "effect/Function"

const ServerApi = HttpApi.make("ServerApi")

export class ServerApiClient extends Effect.Service<ServerApiClient>()(
  "ServerApiClient",
  {
    dependencies: [NodeHttpClient.layerUndici],
    effect: Effect.gen(function*() {
      const serverBaseUrl = yield* pipe(
        Config.string("SERVER_BASE_URL"),
        Config.withDefault("http://localhost:10000")
      )

      const client = yield* HttpApiClient.make(ServerApi, { baseUrl: serverBaseUrl })

      return client
    })
  }
) {}
