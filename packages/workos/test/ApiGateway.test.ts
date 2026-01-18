import { NodeKeyValueStore } from "@effect/platform-node"
import { describe, layer } from "@effect/vitest"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as ApiGateway from "../src/ApiGateway.ts"
import * as Store from "../src/Store.ts"
import * as TokenGenerator from "../src/TokenGenerator.ts"
import { createUserManagementTests } from "./UserManagement.suite.ts"

const store = pipe(
  Store.layerTest(),
  Layer.provide(NodeKeyValueStore.layerFileSystem("./test/data/api")),
  Layer.provide(TokenGenerator.layerKeyPairTest())
)

const unitTestLayer = pipe(
  ApiGateway.layerTest(),
  Layer.provide(store)
)

describe("ApiGateway - Unit", () => {
  layer(unitTestLayer)(createUserManagementTests())
})
