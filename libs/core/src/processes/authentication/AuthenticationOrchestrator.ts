import * as WorkOSApiClient from "@effect/auth-workos/ApiClient"
import type * as WorkOSValues from "@effect/auth-workos/domain/Values"
import type { AuthenticationContext } from "@one-kilo/domain/values/AuthenticationContext"
import { dieWithUnexpectedErrorCallback, orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Context from "effect/Context"
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as Predicate from "effect/Predicate"
import { AuthenticationQueryModule } from "../../modules/authentication/AuthenticationQueryModule.ts"
import { RegistrationUseCases } from "../registration/RegistrationUseCases.ts"

type CodeExchangeOutcome = Data.TaggedEnum<{
  NewlyCreatedAccount: AuthenticationContext
  ReturningAccount: AuthenticationContext
}>
const CodeExchangeOutcome = Data.taggedEnum<CodeExchangeOutcome>()

export class AuthenticationOrchestrator extends Context.Service<AuthenticationOrchestrator>()(
  "@one-kilo/core/AuthenticationOrchestrator",
  {
    make: Effect.gen(function*() {
      const workosDirectClient = yield* WorkOSApiClient.ApiClient

      const authenticationQueryModule = yield* AuthenticationQueryModule
      const registrationProcesses = yield* RegistrationUseCases

      const exchangeCode = Effect.fn("AuthenticationOrchestrator.exchangeCode")(
        function*(options: { readonly code: WorkOSValues.AuthenticationCode }) {
          const {
            user: workosUser,
            organizationId: workosOrganizationId,
            accessToken: workosAccessToken,
            refreshToken: workosRefreshToken
          } = yield* pipe(
            workosDirectClient.userManagement.authenticateWithCode({ code: options.code }),
            Effect.catchTag(
              "WorkOSCommonError",
              dieWithUnexpectedErrorCallback("Failed to authenticate with WorkOS code.")
            )
          )

          const handleRegisterAccountForPerson = pipe(
            registrationProcesses.registerAccountForPerson({ workosUser }),
            Effect.flatMap(({ accountId, workspaceId, workosOrganizationId }) =>
              pipe(
                workosDirectClient.userManagement.authenticateWithRefreshToken({
                  refreshToken: workosRefreshToken,
                  organizationId: workosOrganizationId
                }),
                orDieWithUnexpectedError("Failed to refresh WorkOS token after registration."),
                Effect.map(({ accessToken, refreshToken }) =>
                  CodeExchangeOutcome.NewlyCreatedAccount({
                    accountId,
                    workspaceId,
                    workosAccessToken: accessToken,
                    workosRefreshToken: refreshToken
                  })
                )
              )
            )
          )

          /*
           * Even though our system enforces a personal workspace for each account, it is still possible for a
           * WorkOS code exchange - for an account already registered in our system - to not specify an organization.
           *
           * This block must exists to gracefully handle this scenario.
           */
          if (Predicate.isNullish(workosOrganizationId)) {
            const defaultIdentity = yield* authenticationQueryModule.retrieveDefaultAuthenticationIdentity({
              workosUserId: workosUser.id
            })

            if (Option.isNone(defaultIdentity)) {
              return yield* handleRegisterAccountForPerson
            }

            const { accountId, workspaceId, workosOrganizationId: defaultWorkosOrganizationId } = defaultIdentity.value

            return yield* pipe(
              workosDirectClient.userManagement.authenticateWithRefreshToken({
                refreshToken: workosRefreshToken,
                organizationId: defaultWorkosOrganizationId
              }),
              orDieWithUnexpectedError(
                "Failed to refresh WorkOS token for an existing account without an organization in the code exchange response."
              ),
              Effect.map(({ accessToken, refreshToken }) =>
                CodeExchangeOutcome.ReturningAccount({
                  accountId,
                  workspaceId,
                  workosAccessToken: accessToken,
                  workosRefreshToken: refreshToken
                })
              )
            )
          }

          const identity = yield* authenticationQueryModule.retrieveAuthenticationIdentity({
            workosUserId: workosUser.id,
            workosOrganizationId
          })

          if (Option.isNone(identity)) {
            return yield* handleRegisterAccountForPerson
          }

          return CodeExchangeOutcome.ReturningAccount({
            accountId: identity.value.accountId,
            workspaceId: identity.value.workspaceId,
            workosAccessToken,
            workosRefreshToken
          })
        }
      )

      return { exchangeCode }
    })
  }
) {
  static readonly layer = pipe(
    Layer.effect(this, this.make),
    Layer.provide([
      AuthenticationQueryModule.layer,
      RegistrationUseCases.layer
    ])
  )
}
