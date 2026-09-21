import { describe, expect, layer } from "@effect/vitest"
import { AuthenticationHeaders } from "@one-kilo/server-api/infra/AuthenticationSecurity"
import * as Effect from "effect/Effect"
import { TestAccountFactory } from "../../factories/TestAccountFactory.ts"
import { TestApplicationApiClient } from "../../factories/TestApiClients.ts"
import * as HttpFixtures from "../../fixtures/HttpFixtures.ts"

const suiteName = "WhoAmIHttp"
const TestLayer = HttpFixtures.layerTest({ suiteName })

layer(TestLayer)(suiteName, (it) => {
  describe("GET `/whoami`", () => {
    it.effect(
      "returns the caller's account and in-scope workspace",
      Effect.fn(function*() {
        const factory = yield* TestAccountFactory
        const client = yield* TestApplicationApiClient

        const { workosAccessToken, accountId, workspaceId } = yield* factory.makeTestAccountForPerson()

        const response = yield* client.whoami({
          headers: AuthenticationHeaders.fromAccessToken(workosAccessToken)
        })

        expect(response).toMatchObject({
          account: {
            id: accountId,
            type: "Person"
          },
          workspace: {
            id: workspaceId,
            type: "Personal"
          }
        })
      })
    )
  })
})
