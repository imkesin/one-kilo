import * as WorkOSApiClient from "@effect/auth-workos/ApiClient"
import * as WorkOSValues from "@effect/auth-workos/domain/Values"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import type { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import { dieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import { UsersQueryRepository } from "@one-kilo/sql/modules/users/UsersQueryRepository"
import { WorkspacesQueryRepository } from "@one-kilo/sql/modules/workspaces/WorkspacesQueryRepository"
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import { RegistrationUseCases } from "../registration/RegistrationUseCases.ts"

type AuthenticationContext = {
  readonly userId: UserId
  readonly workspaceId: WorkspaceId
  readonly workosAccessToken: WorkOSValues.AccessToken
  readonly workosRefreshToken: WorkOSValues.RefreshToken
}
type CodeExchangeOutcome = Data.TaggedEnum<{
  NewlyCreatedUser: AuthenticationContext
  ReturningUser: AuthenticationContext
}>
const CodeExchangeOutcome = Data.taggedEnum<CodeExchangeOutcome>()

export class SessionsOrchestrator extends Effect.Service<SessionsOrchestrator>()(
  "@one-kilo/server/SessionsOrchestrator",
  {
    dependencies: [
      UsersQueryRepository.Default,
      RegistrationUseCases.Default,
      WorkspacesQueryRepository.Default
    ],
    effect: Effect.gen(function*() {
      const { client: workosClient } = yield* WorkOSApiClient.ApiClient

      const registrationProcesses = yield* RegistrationUseCases
      const usersQueryRepository = yield* UsersQueryRepository
      const workspacesQueryRepository = yield* WorkspacesQueryRepository

      const exchangeCodeForSession = Effect.fn("SessionsOrchestrator.exchangeCodeForSession")(
        function*(options: { readonly code: WorkOSValues.AuthenticationCode }) {
          const {
            user: workosUser,
            organizationId: workosOrganizationId,
            accessToken: workosAccessToken,
            refreshToken: workosRefreshToken
          } = yield* workosClient.userManagement.authenticateWithCode({ code: options.code })

          const handleReturningUser = (userId: UserId) =>
            pipe(
              Option.fromNullable(workosOrganizationId),
              Option.match({
                onNone: () => dieWithUnexpectedError("Existing user is not associated with an organization"),
                onSome: (workosOrganizationId) =>
                  Effect.andThen(
                    workspacesQueryRepository.findWorkspaceEntityByWorkOSOrganizationId({ workosOrganizationId }),
                    Option.match({
                      onNone: () => dieWithUnexpectedError("Existing user's workspace not found"),
                      onSome: ({ id }) =>
                        Effect.succeed(
                          CodeExchangeOutcome.ReturningUser({
                            userId,
                            workspaceId: id,
                            workosAccessToken,
                            workosRefreshToken
                          })
                        )
                    })
                  )
              })
            )

          const outcome = yield* Effect.andThen(
            usersQueryRepository.findUserEntityByWorkOSUserId({ workosUserId: workosUser.id }),
            Option.match({
              onNone: () =>
                Effect.map(
                  registrationProcesses.registerHumanUser({ workosUser, workosRefreshToken }),
                  CodeExchangeOutcome.NewlyCreatedUser
                ),
              onSome: ({ id }) => handleReturningUser(id)
            })
          )

          return outcome
        }
      )

      return { exchangeCodeForSession }
    })
  }
) {}
