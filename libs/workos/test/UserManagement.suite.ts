import { expect, type Vitest } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as ApiGateway from "../src/ApiGateway.ts"
import { EmailAddress } from "../src/domain/DomainIds.ts"

export const createUserManagementTests = () => (it: Vitest.MethodsNonLive<ApiGateway.ApiGateway, boolean>) => {
  it.effect("can create a user via UserManagement API", () =>
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
}
