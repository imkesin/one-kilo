import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import { describe, layer } from "@effect/vitest"
import * as Config from "effect/Config"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as ApiClient from "../src/ApiClient.ts"
import { EnvironmentClientId } from "../src/domain/Ids.ts"
import * as EventsSuite from "./Events.suite.ts"

const integrationTestLayer = pipe(
  ApiClient.layerConfig({
    clientId: pipe(
      Config.string("WORKOS_CLIENT_ID"),
      Config.map(EnvironmentClientId.make)
    ),
    clientSecret: pipe(
      Config.string("WORKOS_API_KEY"),
      (_) => Config.redacted(_)
    )
  }),
  Layer.provide(NodeHttpClient.layer)
)

describe("ApiClient - Integration", () => {
  layer(integrationTestLayer, { excludeTestServices: true })(EventsSuite.makeEventsTests())
})
