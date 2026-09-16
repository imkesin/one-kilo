import * as WorkOSStore from "@effect/auth-workos/Store"
import * as WorkOSTokenGenerator from "@effect/auth-workos/TokenGenerator"
import { RegistrationUseCases } from "@one-kilo/core/processes/registration/RegistrationUseCases"
import * as Effect from "effect/Effect"
import * as Encoding from "effect/Encoding"
import { pipe } from "effect/Function"
import { randomBytes } from "node:crypto"

export class TestAccountFactory extends Effect.Service<TestAccountFactory>()(
  "@one-kilo/server/TestAccountFactory",
  {
    dependencies: [RegistrationUseCases.Default],
    effect: Effect.gen(function*() {
      const registrationUseCases = yield* RegistrationUseCases

      const workosStore = yield* WorkOSStore.Store
      const workosTokenGenerator = yield* WorkOSTokenGenerator.TokenGenerator

      const makeTestAccountForPerson = Effect.fn(function*() {
        const email = pipe(
          Encoding.encodeHex(randomBytes(2)),
          (hex) => `human-account-${hex}@test.com`
        )

        const workosUser = yield* workosStore.apiClient.userManagement.createUser({ email })

        const {
          accountId,
          workspaceId,
          workosOrganizationId
        } = yield* registrationUseCases.registerAccountForPerson({ workosUser })

        const workosAccessToken = yield* workosTokenGenerator.generateSessionAccessToken({
          userId: workosUser.id,
          organizationId: workosOrganizationId
        })

        return { accountId, workspaceId, workosAccessToken }
      })

      return { makeTestAccountForPerson }
    })
  }
) {}
