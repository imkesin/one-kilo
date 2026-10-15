import { ApplicationApi } from "@one-kilo/server-api/ServerApi"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as HttpApiClient from "effect/http-api/HttpApiClient"
import * as Layer from "effect/Layer"

export class TestApplicationApiClient extends Context.Service<TestApplicationApiClient>()(
  "@one-kilo/server/TestApplicationApiClient",
  {
    make: Effect.gen(function*() {
      return yield* HttpApiClient.make(ApplicationApi)
    })
  }
) {
  static readonly layer = Layer.effect(this, this.make)
}
