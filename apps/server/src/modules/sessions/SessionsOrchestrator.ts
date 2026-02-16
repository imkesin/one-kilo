import * as WorkOSApiClient from "@effect/auth-workos/ApiClient"
import * as WorkOSValues from "@effect/auth-workos/domain/Values"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import { dieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import { UsersQueryRepository } from "@one-kilo/sql/modules/users/UsersQueryRepository"
import { WorkspacesQueryRepository } from "@one-kilo/sql/modules/workspaces/WorkspacesQueryRepository"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import { RegistrationProcesses } from "../../processes/registration/RegistrationProcesses.ts"

export class SessionsOrchestrator extends Effect.Service<SessionsOrchestrator>()(
  "@one-kilo/server/SessionsOrchestrator",
  {
    dependencies: [
      UsersQueryRepository.Default,
      RegistrationProcesses.Default,
      WorkspacesQueryRepository.Default
    ],
    effect: Effect.gen(function*() {
      const { client: workosClient } = yield* WorkOSApiClient.ApiClient

      const registrationProcesses = yield* RegistrationProcesses
      const usersQueryRepository = yield* UsersQueryRepository
      const workspacesQueryRepository = yield* WorkspacesQueryRepository

      const exchangeCodeForSession = Effect.fn(function*(options: {
        readonly code: WorkOSValues.AuthenticationCode
      }) {
        const {
          user: workosUser,
          organizationId: workosOrganizationId,
          accessToken,
          refreshToken
        } = yield* workosClient.userManagement.authenticateWithCode({ code: options.code })

        const handleExistingUser = (userId: UserId) =>
          pipe(
            Option.fromNullable(workosOrganizationId),
            Option.match({
              onNone: () => dieWithUnexpectedError("Existing user is not associated with an organization"),
              onSome: (workosOrganizationId) =>
                Effect.flatMap(
                  workspacesQueryRepository.findWorkspaceEntityByWorkOSOrganizationId({ workosOrganizationId }),
                  Option.match({
                    onNone: () => dieWithUnexpectedError("Existing user's workspace not found"),
                    onSome: ({ id }) => Effect.succeed({ userId: userId, workspaceId: id })
                  })
                )
            })
          )

        const _result = yield* Effect.andThen(
          usersQueryRepository.findUserEntityByWorkOSUserId({ workosUserId: workosUser.id }),
          Option.match({
            onNone: () => registrationProcesses.registerHumanUser({ workosUser }),
            onSome: ({ id }) => handleExistingUser(id)
          })
        )

        // Need to transform this into something useful on the way out
        // Probably just the domain-specific userId and workspaceId

        return { accessToken, refreshToken }
      })

      return { exchangeCodeForSession }
    })
  }
) {}
