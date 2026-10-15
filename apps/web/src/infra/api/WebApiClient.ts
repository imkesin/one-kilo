import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as HttpApiClient from "effect/http-api/HttpApiClient"
import * as FetchHttpClient from "effect/http/FetchHttpClient"
import * as Layer from "effect/Layer"
import { WebApi } from "~/infra/api/WebApi"

export class WebApiClient extends Context.Service<WebApiClient>()(
  "@one-kilo/web/WebApiClient",
  {
    make: Effect.gen(function*() {
      const webApiClient = yield* HttpApiClient.make(WebApi)

      return webApiClient
    })
  }
) {
  static readonly layer = pipe(
    Layer.effect(this, this.make),
    Layer.provide(FetchHttpClient.layer)
  )
}
