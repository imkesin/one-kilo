import * as NodeServices from "@effect/platform-node/NodeServices"
import { describe, layer } from "@effect/vitest"
import * as Config from "effect/Config"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as KeyValueStore from "effect/persistence/KeyValueStore"
import * as ApiGateway from "../src/ApiGateway.ts"
import * as Store from "../src/Store.ts"
import * as TokenGenerator from "../src/TokenGenerator.ts"
import * as OrganizationsSuite from "./Organizations.suite.ts"
import * as UserManagementSuite from "./UserManagement.suite.ts"

const store = pipe(
  Store.layerTest(),
  Layer.provide(pipe(
    KeyValueStore.layerFileSystem("./test/data/api"),
    Layer.provide(NodeServices.layer)
  )),
  Layer.provide(TokenGenerator.layerKeyPairTestConfig({
    authKitDomain: Config.String("WORKOS_AUTHKIT_DOMAIN")
  }))
)

const unitTestLayer = pipe(
  ApiGateway.layerTest,
  Layer.provide(store)
)

describe("ApiGateway - Unit", () => {
  layer(unitTestLayer)(UserManagementSuite.makeUserManagementTests())
  layer(unitTestLayer)(OrganizationsSuite.makeOrganizationTests())
})
