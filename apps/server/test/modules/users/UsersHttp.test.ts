import { expect, layer } from "@effect/vitest"
import { AuthenticationHeaders } from "@one-kilo/server-api/infra/AuthenticationSecurity"
import * as Effect from "effect/Effect"
import { describe } from "node:test"
import { TestApplicationApiClient } from "../../factories/TestApiClients.ts"
import { TestUserFactory } from "../../factories/TestUserFactory.ts"
import * as HttpFixtures from "../../fixtures/HttpFixtures.ts"

const suiteName = "UsersHttp"
const TestLayer = HttpFixtures.layerTest({ suiteName })

layer(TestLayer)(suiteName, (it) => {
  describe("GET `/users/me`", () => {
    it.effect(
      "returns a user matching the caller",
      Effect.fn(function*() {
        const factory = yield* TestUserFactory
        const client = yield* TestApplicationApiClient

        const { workosAccessToken, userId } = yield* factory.makeTestHumanUser()

        const response = yield* client.users.me({
          headers: AuthenticationHeaders.fromAccessToken(workosAccessToken)
        })

        expect(response).toMatchObject({
          user: {
            id: userId,
            type: "Person"
          }
        })
      })
    )
  })
})
