import * as WorkOSApiClient from "@effect/auth-workos/ApiClient"
import * as WorkOSValues from "@effect/auth-workos/domain/Values"
import type { AuthenticationContext } from "@one-kilo/domain/values/AuthenticationContext"
import { dieWithUnexpectedErrorCallback } from "@one-kilo/lib/errors/UnexpectedError"
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as Predicate from "effect/Predicate"
import { AuthenticationQueryModule } from "../../modules/authentication/AuthenticationQueryModule.ts"
import { RegistrationUseCases } from "../registration/RegistrationUseCases.ts"

type CodeExchangeOutcome = Data.TaggedEnum<{
  NewlyCreatedUser: AuthenticationContext
  ReturningUser: AuthenticationContext
}>
const CodeExchangeOutcome = Data.taggedEnum<CodeExchangeOutcome>()

export class AuthenticationOrchestrator extends Effect.Service<AuthenticationOrchestrator>()(
  "@one-kilo/server/AuthenticationOrchestrator",
  {
    dependencies: [
      AuthenticationQueryModule.Default,
      RegistrationUseCases.Default
    ],
    effect: Effect.gen(function*() {
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

          const registerHumanUserEffect = Effect.map(
            registrationProcesses.registerHumanUser({ workosUser, workosRefreshToken }),
            CodeExchangeOutcome.NewlyCreatedUser
          )

          if (Predicate.isNullable(workosOrganizationId)) {
            return yield* registerHumanUserEffect
          }

          return yield* Effect.andThen(
            authenticationQueryModule.retrieveAuthenticationIdentity({
              workosUserId: workosUser.id,
              workosOrganizationId
            }),
            Option.match({
              onNone: () => registerHumanUserEffect,
              onSome: ({ userId, workspaceId }) =>
                Effect.succeed(
                  CodeExchangeOutcome.ReturningUser({
                    userId,
                    workspaceId,
                    workosAccessToken,
                    workosRefreshToken
                  })
                )
            })
          )
        }
      )

      return { exchangeCode }
    })
  }
) {}
