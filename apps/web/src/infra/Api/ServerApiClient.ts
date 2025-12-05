import { HttpApi, HttpApiClient } from "@effect/platform"
import { NodeHttpClient } from "@effect/platform-node"
import { Effect } from "effect"

const ServerApi = HttpApi.make("ServerApi")

export class ServerApiClient extends Effect.Service<ServerApiClient>()(
  "ServerApiClient",
  {
    dependencies: [NodeHttpClient.layerUndici],
    effect: Effect.gen(function*() {
      const client = yield* HttpApiClient.make(
        ServerApi,
        { baseUrl: "http://localhost:10000" }
      )

      return client
    })
  }
) {}
