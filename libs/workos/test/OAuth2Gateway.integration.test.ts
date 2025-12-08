import { NodeHttpClient } from "@effect/platform-node"
import { describe, layer } from "@effect/vitest"
import * as Config from "effect/Config"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { ClientId } from "../src/domain/DomainIds.ts"
import * as OAuth2Client from "../src/OAuth2Client.ts"
import * as OAuth2Gateway from "../src/OAuth2Gateway.ts"
import * as TokenClient from "../src/TokenClient.ts"
import * as OAuth2TestSuite from "./OAuth2.suite.ts"

const oauth2Gateway = pipe(
  OAuth2Gateway.layer(),
  Layer.provide(
    OAuth2Client.layerConfig({ authKitDomain: Config.string("WORKOS_AUTHKIT_DOMAIN") })
  )
)
const tokenClient = TokenClient.layerConfig({
  clientId: pipe(
    Config.string("WORKOS_CLIENT_ID"),
    Config.map(ClientId.make)
  )
})
const configIntegration = Config.nested(
  Config.all({
    machineClientId: pipe(
      Config.string("MACHINE_CLIENT_ID"),
      Config.map(ClientId.make)
    ),
    machineClientSecret: pipe(
      Config.string("MACHINE_CLIENT_SECRET"),
      (_) => Config.redacted(_)
    )
  }),
  "WORKOS"
)
const testSuiteContext = Layer.effect(
  OAuth2TestSuite.OAuth2TestSuiteContext,
  Config.unwrap(configIntegration)
)

// const devTools = Layer.provide(
//   DevTools.layerWebSocket(),
//   NodeSocket.layerWebSocketConstructor
// )

const integrationTestLayer = pipe(
  Layer.mergeAll(
    oauth2Gateway,
    tokenClient,
    testSuiteContext
  ),
  Layer.provide(NodeHttpClient.layer)
)

describe("OAuth2Client - Integration", () => {
  layer(integrationTestLayer, { excludeTestServices: true })(OAuth2TestSuite.createOAuth2Tests())
})
