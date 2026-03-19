import { AuthenticationQueryRepository } from "@one-kilo/sql/modules/authentication/AuthenticationQueryRepository"
import * as Effect from "effect/Effect"

export class AuthenticationQueryModule extends Effect.Service<AuthenticationQueryModule>()(
  "@one-kilo/server/AuthenticationQueryModule",
  {
    dependencies: [AuthenticationQueryRepository.Default],
    effect: Effect.gen(function*() {
      const authenticationQueryRepository = yield* AuthenticationQueryRepository

      return { loadAuthenticationContext: authenticationQueryRepository.findUserIdAndWorkspaceId }
    })
  }
) {}
