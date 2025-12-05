import { FetchHttpClient, HttpApiClient } from "@effect/platform"
import { Effect } from "effect"
import { WebApi } from "~/app/api/WebApi"

export class WebApiClient extends Effect.Service<WebApiClient>()(
  "WebApiClient",
  {
    dependencies: [FetchHttpClient.layer],
    effect: Effect.gen(function*() {
      const api = yield* HttpApiClient.make(WebApi)

      return api
    })
  }
) {}
