import { describe, expect, type Vitest } from "@effect/vitest"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as ApiGateway from "../src/ApiGateway.ts"

export const makeOrganizationTests = () => (it: Vitest.MethodsNonLive<ApiGateway.ApiGateway, boolean>) => {
  describe("Organizations", () => {
    it.scoped("can create an organization", () =>
      Effect.gen(function*() {
        const { client } = yield* ApiGateway.ApiGateway

        const timestamp = Date.now()
        const organizationName = `test-org-${timestamp}`

        const organization = yield* client.organizations.createOrganization({
          name: organizationName,
          metadata: {
            testRun: timestamp.toString()
          }
        })

        yield* Effect.addFinalizer(() =>
          pipe(
            client.organizations.deleteOrganization(organization.id),
            Effect.tapError((e) => Effect.logWarning("Failed to delete an organization", e)),
            Effect.ignore
          )
        )

        expect(organization.name).toEqual(organizationName)
        expect(organization.metadata).toMatchObject({
          testRun: timestamp.toString()
        })
        expect(organization.domains).toEqual([])
      }))
  })
}
