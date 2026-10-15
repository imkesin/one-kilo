import { AuthenticationQueryRepository } from "@one-kilo/sql/modules/authentication/AuthenticationQueryRepository"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"

export class AuthenticationQueryModule extends Context.Service<AuthenticationQueryModule>()(
  "@one-kilo/core/AuthenticationQueryModule",
  {
    make: Effect.gen(function*() {
      const authenticationQueryRepository = yield* AuthenticationQueryRepository

      return {
        retrieveAuthenticationIdentity: authenticationQueryRepository.findAuthenticationIdentity,
        retrieveDefaultAuthenticationIdentity: authenticationQueryRepository.findDefaultAuthenticationIdentity
      }
    })
  }
) {
  static readonly layer = pipe(
    Layer.effect(this, this.make),
    Layer.provide(AuthenticationQueryRepository.layer)
  )
}
