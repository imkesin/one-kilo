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
      Config.String("WORKOS_CLIENT_ID"),
      Config.map(EnvironmentClientId.make)
    ),
    clientSecret: Config.Redacted("WORKOS_API_KEY")
  }),
  Layer.provide(NodeHttpClient.layerNodeHttp)
)

describe("ApiClient - Integration", () => {
  layer(integrationTestLayer, { excludeTestServices: true })(EventsSuite.makeEventsTests())
})
