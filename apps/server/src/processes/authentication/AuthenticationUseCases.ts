import * as WorkOSApiClient from "@effect/auth-workos/ApiClient"
import * as WorkOSValues from "@effect/auth-workos/domain/Values"
import { dieWithUnexpectedError, dieWithUnexpectedErrorCallback } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as Predicate from "effect/Predicate"
import { AuthenticationQueryModule } from "../../modules/authentication/AuthenticationQueryModule.ts"

type RefreshContextParameters = {
  readonly refreshToken: WorkOSValues.RefreshToken
}

export class AuthenticationUseCases extends Effect.Service<AuthenticationUseCases>()(
  "@one-kilo/server/AuthenticationUseCases",
  {
    dependencies: [
      AuthenticationQueryModule.Default
    ],
    effect: Effect.gen(function*() {
      const workosDirectClient = yield* WorkOSApiClient.ApiClient

      const authenticationQueryModule = yield* AuthenticationQueryModule

      const refreshContext = Effect.fn("AuthenticationUseCases.refreshContext")(
        function*({ refreshToken: inputWorkosRefreshToken }: RefreshContextParameters) {
          const {
            user: workosUser,
            organizationId: workosOrganizationId,
            accessToken: workosAccessToken,
            refreshToken: outputWorkosRefreshToken
          } = yield* pipe(
            workosDirectClient.userManagement.authenticateWithRefreshToken({ refreshToken: inputWorkosRefreshToken }),
            Effect.catchTag(
              "WorkOSCommonError",
              dieWithUnexpectedErrorCallback("Failed to refresh WorkOS token.")
            )
          )

          if (Predicate.isNullable(workosOrganizationId)) {
            return yield* dieWithUnexpectedError("Refresh token response is not associated with an organization")
          }

          return yield* pipe(
            authenticationQueryModule.loadAuthenticationContext({
              workosUserId: workosUser.id,
              workosOrganizationId
            }),
            Effect.andThen(
              Option.match({
                onNone: () => dieWithUnexpectedError("User or workspace not found for authentication context"),
                onSome: ({ userId, workspaceId }) =>
                  Effect.succeed({
                    userId,
                    workspaceId,
                    workosAccessToken,
                    workosRefreshToken: outputWorkosRefreshToken
                  })
              })
            )
          )
        }
      )

      return { refreshContext }
    })
  }
) {}
