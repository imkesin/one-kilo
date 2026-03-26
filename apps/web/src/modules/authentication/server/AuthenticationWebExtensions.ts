import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import type {
  Authentication_ContextCookieNotFoundError,
  Authentication_ContextExpiredError
} from "./AuthenticationErrors"
import { AuthenticationWebModule } from "./AuthenticationWebModule"

export const withCurrentAuthenticationContextOr = <A, E, R, A2, E2, R2>(
  onInvalid: (
    error: Authentication_ContextCookieNotFoundError | Authentication_ContextExpiredError
  ) => Effect.Effect<A, E, R>
) =>
(self: Effect.Effect<A2, E2, R2>) =>
  pipe(
    Effect.flatMap(AuthenticationWebModule, ({ currentAuthenticationContext }) => currentAuthenticationContext),
    Effect.catchTags({
      "Authentication:ContextCookieNotFoundError": onInvalid,
      "Authentication:ContextExpiredError": onInvalid
    }),
    Effect.andThen(self)
  )
