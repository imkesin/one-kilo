import * as WorkOSStore from "@effect/auth-workos/Store"
import * as WorkOSTokenGenerator from "@effect/auth-workos/TokenGenerator"
import * as Effect from "effect/Effect"
import * as Encoding from "effect/Encoding"
import { pipe } from "effect/Function"
import { randomBytes } from "node:crypto"
import { RegistrationUseCases } from "../../src/processes/registration/RegistrationUseCases.ts"

export class TestUserFactory extends Effect.Service<TestUserFactory>()(
  "@one-kilo/server/TestUserFactory",
  {
    dependencies: [RegistrationUseCases.Default],
    effect: Effect.gen(function*() {
      const registrationUseCases = yield* RegistrationUseCases

      const workosStore = yield* WorkOSStore.Store
      const workosTokenGenerator = yield* WorkOSTokenGenerator.TokenGenerator

      const makeTestHumanUser = Effect.fn(function*() {
        const email = pipe(
          Encoding.encodeHex(randomBytes(2)),
          (hex) => `human-user-${hex}@test.com`
        )

        const workosUser = yield* workosStore.apiClient.userManagement.createUser({ email })

        const {
          userId,
          workspaceId,
          workosOrganizationId
        } = yield* registrationUseCases.registerHumanUser({ workosUser })

        const workosAccessToken = yield* workosTokenGenerator.generateSessionAccessToken({
          userId: workosUser.id,
          organizationId: workosOrganizationId
        })

        return { userId, workspaceId, workosAccessToken }
      })

      return { makeTestHumanUser }
    })
  }
) {}
