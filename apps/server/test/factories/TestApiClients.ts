import * as HttpApiClient from "@effect/platform/HttpApiClient"
import { ApplicationApi } from "@one-kilo/server-api/ServerApi"
import * as Effect from "effect/Effect"

export class TestApplicationApiClient extends Effect.Service<TestApplicationApiClient>()(
  "@one-kilo/server/TestApplicationApiClient",
  {
    effect: Effect.gen(function*() {
      return yield* HttpApiClient.make(ApplicationApi)
    })
  }
) {}
