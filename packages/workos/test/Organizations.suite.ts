import { describe, expect, type Vitest } from "@effect/vitest"
import * as Effect from "effect/Effect"
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

        yield* Effect.addFinalizer(() => client.organizations.deleteOrganization(organization.id))

        expect(organization.name).toEqual(organizationName)
        expect(organization.metadata).toMatchObject({
          testRun: timestamp.toString()
        })

        expect(organization.id).toBeDefined()
        expect(organization.createdAt).toBeInstanceOf(Date)
        expect(organization.updatedAt).toBeInstanceOf(Date)
        expect(organization.domains).toEqual([])
      }))
  })
}
