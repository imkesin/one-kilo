import * as FetchHttpClient from "@effect/platform/FetchHttpClient"
import * as HttpApiClient from "@effect/platform/HttpApiClient"
import * as Effect from "effect/Effect"
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
