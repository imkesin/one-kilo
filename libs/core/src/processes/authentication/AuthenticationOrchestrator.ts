import * as WorkOSApiClient from "@effect/auth-workos/ApiClient"
import * as WorkOSValues from "@effect/auth-workos/domain/Values"
import type { AuthenticationContext } from "@one-kilo/domain/values/AuthenticationContext"
import { dieWithUnexpectedErrorCallback, orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
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
  "@one-kilo/core/AuthenticationOrchestrator",
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

          const registerHumanUserEffect = pipe(
            registrationProcesses.registerHumanUser({ workosUser }),
            Effect.flatMap(({ userId, workspaceId, workosOrganizationId }) =>
              pipe(
                workosDirectClient.userManagement.authenticateWithRefreshToken({
                  refreshToken: workosRefreshToken,
                  organizationId: workosOrganizationId
                }),
                orDieWithUnexpectedError("Failed to refresh WorkOS token after registration."),
                Effect.map(({ accessToken, refreshToken }) =>
                  CodeExchangeOutcome.NewlyCreatedUser({
                    userId,
                    workspaceId,
                    workosAccessToken: accessToken,
                    workosRefreshToken: refreshToken
                  })
                )
              )
            )
          )

          /*
           * Even though our system enforces a personal workspace for each user, it is still possible for a
           * WorkOS code exchange - for a user already registered in our system - to not specify an organization.
           *
           * This block must exists to gracefully handle this scenario.
           */
          if (Predicate.isNullable(workosOrganizationId)) {
            return yield* Effect.andThen(
              authenticationQueryModule.retrieveDefaultAuthenticationIdentity({ workosUserId: workosUser.id }),
              Option.match({
                onNone: () => registerHumanUserEffect,
                onSome: ({
                  userId,
                  workspaceId,
                  workosOrganizationId: defaultWorkosOrganizationId
                }) =>
                  pipe(
                    workosDirectClient.userManagement.authenticateWithRefreshToken({
                      refreshToken: workosRefreshToken,
                      organizationId: defaultWorkosOrganizationId
                    }),
                    orDieWithUnexpectedError(
                      "Failed to refresh WorkOS token for an existing user without an organization in the code exchange response."
                    ),
                    Effect.map(({ accessToken, refreshToken }) =>
                      CodeExchangeOutcome.ReturningUser({
                        userId,
                        workspaceId,
                        workosAccessToken: accessToken,
                        workosRefreshToken: refreshToken
                      })
                    )
                  )
              })
            )
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
