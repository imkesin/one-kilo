import { describe, expect, type Vitest } from "@effect/vitest"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as ApiGateway from "../src/ApiGateway.ts"

export const makeOrganizationTests = () => (it: Vitest.MethodsNonLive<ApiGateway.ApiGateway, boolean>) => {
  describe("Organizations", () => {
    it.scoped("can create an organization", () =>
      Effect.gen(function*() {
        const gatewayClient = yield* ApiGateway.ApiGateway

        const timestamp = Date.now()
        const organizationName = `test-org-${timestamp}`

        const organization = yield* gatewayClient.organizations.createOrganization({
          name: organizationName,
          metadata: {
            testRun: timestamp.toString()
          }
        })

        yield* Effect.addFinalizer(() =>
          pipe(
            gatewayClient.organizations.deleteOrganization(organization.id),
            Effect.tapErrorCause((cause) => Effect.logWarning("Failed to delete an organization", cause)),
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
