import type { UserId } from "@one-kilo/domain/ids/UserId"
import { createServerFn } from "@tanstack/react-start"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import { runWithWebServerRuntime } from "~/infra/runtime/server/runWithServerRuntime"
import { AuthenticationWebModule } from "./AuthenticationWebModule"

export type AuthSession = {
  readonly userId: UserId
}

/*
 * Reads the current (non-expired) authentication context from the httpOnly
 * cookie and projects it down to a non-secret session shape. The WorkOS access
 * and refresh tokens are deliberately NOT returned — they stay server-side in
 * the cookie and are re-validated per request by the `/api` handler.
 */
const authSessionEffect = pipe(
  Effect.flatMap(AuthenticationWebModule, ({ currentAuthenticationContext }) => currentAuthenticationContext),
  Effect.map(({ userId }): AuthSession => ({ userId })),
  Effect.asSome,
  Effect.catchTags({
    "Authentication:ContextCookieNotFoundError": () => Effect.succeedNone,
    "Authentication:ContextExpiredError": () => Effect.succeedNone
  })
)

export const getAuthSession = createServerFn({ method: "GET" }).handler(async (): Promise<AuthSession | null> => {
  const session = await runWithWebServerRuntime(authSessionEffect)
  return Option.getOrNull(session)
})
