import { describe, expect, type Vitest } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as ApiGateway from "../src/ApiGateway.ts"
import { EmailAddress } from "../src/domain/DomainValues.ts"

export const makeUserManagementTests = () => (it: Vitest.MethodsNonLive<ApiGateway.ApiGateway, boolean>) => {
  describe("User Management", () => {
    it.scoped("can create a user", () =>
      Effect.gen(function*() {
        const { client } = yield* ApiGateway.ApiGateway

        const timestamp = Date.now()
        const testEmail = EmailAddress.make(`test-user-${timestamp}@example.com`)

        const user = yield* client.userManagement.createUser({
          email: testEmail,
          firstName: "Test",
          lastName: "User",
          metadata: {
            testRun: timestamp.toString()
          }
        })

        yield* Effect.addFinalizer(() => client.userManagement.deleteUser(user.id))

        expect(user.email).toEqual(testEmail)
        expect(user.firstName).toEqual("Test")
        expect(user.lastName).toEqual("User")
        expect(user.emailVerified).toEqual(false)
        expect(user.metadata).toMatchObject({
          testRun: timestamp.toString()
        })

        expect(user.id).toBeDefined()
        expect(user.createdAt).toBeInstanceOf(Date)
      }))

    it.scoped("can create an organization membership", () =>
      Effect.gen(function*() {
        const { client } = yield* ApiGateway.ApiGateway

        const timestamp = Date.now()

        const organization = yield* client.organizations.createOrganization({
          name: `test-org-${timestamp}`
        })
        yield* Effect.addFinalizer(() => client.organizations.deleteOrganization(organization.id))

        const testEmail = EmailAddress.make(`test-user-${timestamp}@example.com`)
        const user = yield* client.userManagement.createUser({
          email: testEmail,
          firstName: "Test",
          lastName: "User"
        })
        yield* Effect.addFinalizer(() => client.userManagement.deleteUser(user.id))

        const membership = yield* client.userManagement.createOrganizationMembership({
          userId: user.id,
          organizationId: organization.id,
          roles: ["member"]
        })
        yield* Effect.addFinalizer(() => client.userManagement.deleteOrganizationMembership(membership.id))

        expect(membership.id).toBeDefined()
        expect(membership.userId).toEqual(user.id)
        expect(membership.organizationId).toEqual(organization.id)
        expect(membership.organizationName).toEqual(organization.name)
        expect(membership.status).toEqual("active")
        expect(membership.roles).toHaveLength(1)
        expect(membership.roles[0]?.slug).toEqual("member")
        expect(membership.createdAt).toBeInstanceOf(Date)
        expect(membership.updatedAt).toBeInstanceOf(Date)
      }))
  })
}
