import { NodeHttpClient } from "@effect/platform-node"
import { describe, layer } from "@effect/vitest"
import * as Config from "effect/Config"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as ApiClient from "../src/ApiClient.ts"
import * as ApiGateway from "../src/ApiGateway.ts"
import { ClientId } from "../src/domain/Ids.ts"
import * as OrganizationsSuite from "./Organizations.suite.ts"
import * as UserManagementSuite from "./UserManagement.suite.ts"

const apiClient = ApiClient.layerConfig({
  clientId: pipe(
    Config.string("WORKOS_CLIENT_ID"),
    Config.map(ClientId.make)
  ),
  clientSecret: pipe(
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
  layer(integrationTestLayer, { excludeTestServices: true })(UserManagementSuite.makeUserManagementTests())
  layer(integrationTestLayer, { excludeTestServices: true })(OrganizationsSuite.makeOrganizationTests())
})
