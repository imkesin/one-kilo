import { NodeHttpClient } from "@effect/platform-node"
import { describe, layer } from "@effect/vitest"
import * as Config from "effect/Config"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as ApiClient from "../src/ApiClient.ts"
import * as ApiGateway from "../src/ApiGateway.ts"
import { createUserManagementTests } from "./UserManagement.suite.ts"

const apiClient = ApiClient.layerConfig({
  apiKey: pipe(
    Config.string("WORKOS_API_KEY"),
    (_) => Config.redacted(_)
  )
})

const integrationTestLayer = pipe(
  ApiGateway.layer(),
  Layer.provide(apiClient),
  Layer.provide(NodeHttpClient.layer)
)

describe("ApiGateway - Integration", () => {
  layer(integrationTestLayer, { excludeTestServices: true })(createUserManagementTests())
})
