import { NodeKeyValueStore } from "@effect/platform-node"
import { describe, layer } from "@effect/vitest"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Redacted from "effect/Redacted"
import { ClientId, OrganizationId } from "../src/domain/DomainIds.ts"
import * as OAuth2Gateway from "../src/OAuth2Gateway.ts"
import * as Store from "../src/Store.ts"
import * as TokenClient from "../src/TokenClient.ts"
import * as TokenGenerator from "../src/TokenGenerator.ts"
import * as OAuth2TestSuite from "./OAuth2.suite.ts"

const machineClientId = ClientId.make("client_TEST")
const machineClientOrgId = OrganizationId.make("org_TEST")
const machineClientSecret = Redacted.make("secret_TEST")

const testSuiteContext = Layer.succeed(
  OAuth2TestSuite.OAuth2TestSuiteContext,
  {
    machineClientId,
    machineClientSecret
  }
)
const store = pipe(
  Store.layerTest({
    initialMachineClients: [{
      clientId: machineClientId,
      orgId: machineClientOrgId,
      secret: machineClientSecret
    }]
  }),
  Layer.provide(NodeKeyValueStore.layerFileSystem("./test/data/oauth2")),
  Layer.provide(TokenGenerator.layerKeyPairTest())
)
const oauth2Gateway = pipe(
  OAuth2Gateway.layerTest(),
  Layer.provide(store)
)

const tokenClient = TokenClient.layerKeyPairTest()

const layerUnitTest = Layer.mergeAll(
  oauth2Gateway,
  tokenClient,
  testSuiteContext
)

describe("OAuth2Gateway - Unit", () => {
  layer(layerUnitTest)(OAuth2TestSuite.createOAuth2Tests())
})
