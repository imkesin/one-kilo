import { describe, expect, type Vitest } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as ApiGateway from "../src/ApiGateway.ts"
import { EmailAddress } from "../src/domain/Values.ts"

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
      }))

    it.scoped("can update a user", () =>
      Effect.gen(function*() {
        const { client } = yield* ApiGateway.ApiGateway

        const timestamp = Date.now()
        const testEmail = EmailAddress.make(`test-user-${timestamp}@example.com`)

        const user = yield* client.userManagement.createUser({
          email: testEmail,
          firstName: "Test",
          lastName: "User"
        })
        yield* Effect.addFinalizer(() => client.userManagement.deleteUser(user.id))

        const updated = yield* client.userManagement.updateUser(user.id, {
          firstName: "Updated",
          externalId: "ext-123"
        })

        expect(updated.id).toEqual(user.id)
        expect(updated.firstName).toEqual("Updated")
        expect(updated.externalId).toEqual("ext-123")

        // Unchanged fields
        expect(updated.lastName).toEqual("User")
        expect(updated.email).toEqual(testEmail)
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

        expect(membership.userId).toEqual(user.id)
        expect(membership.organizationId).toEqual(organization.id)
        expect(membership.organizationName).toEqual(organization.name)
        expect(membership.status).toEqual("active")
        expect(membership.roles).toHaveLength(1)
        expect(membership.roles[0]?.slug).toEqual("member")
      }))
  })
}
