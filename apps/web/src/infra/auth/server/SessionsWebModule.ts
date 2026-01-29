import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import { ServerApiClient } from "~/infra/api/ServerApiClient"
import { DynamicServerError } from "~/lib/errors"
import { cookies } from "next/headers"
import { UnexpectedError } from "@effect-workos/lib/errors/UnexpectedError"
import { isDynamicServerError as isNextDynamicServerError } from "next/dist/client/components/hooks-server-context"
import * as Jose from "jose"
import * as WorkOSValues from "@effect-workos/workos/domain/Values"
import * as Clock from "effect/Clock"
import * as S from "effect/Schema"

export class AccessTokenCookieNotFoundError extends S.TaggedError<AccessTokenCookieNotFoundError>()(
  "AccessTokenCookieNotFoundError",
  {},
  {
    description: "An access token cookie was not found"
  }
) {}

export class AccessTokenExpiredError extends S.TaggedError<AccessTokenExpiredError>()(
  "AccessTokenExpiredError",
  {
    accessToken: WorkOSValues.AccessToken
  },
  {
    description: "The access token is expired"
  }
) {}

const HTTP_ONLY_COOKIE_NAME = "effect-workos/web/jwt-session-cookie"

export class SessionsWebModule extends Effect.Service<SessionsWebModule>()(
  "SessionsWebModule",
  {
    dependencies: [ServerApiClient.Default],
    effect: Effect.gen(function*() {
      const serverApiClient = yield* ServerApiClient

      const cookiesStoreEffect = pipe(
        Effect.tryPromise({
          try: () => cookies(),
          catch: (error) => {
            if (isNextDynamicServerError(error)) {
              return DynamicServerError.fromNextDynamicServerError(error)
            }

            return new UnexpectedError({ message: "Failed to retrieve cookies", cause: error })
          }
        }),
        Effect.catchTag("UnexpectedError", Effect.die)
      )

      const setSessionJWT = Effect.fn(
        function*(accessToken: WorkOSValues.AccessToken) {
          const cookieStore = yield* cookiesStoreEffect

          cookieStore.set(
            HTTP_ONLY_COOKIE_NAME,
            accessToken,
            {
              httpOnly: true,
              secure: true,
              sameSite: "lax",
              path: "/",
              maxAge: 30 * 60 // 30 minutes
            }
          )
        }
      )

      const checkAccessTokenExpiration = Effect.fn(function*(accessToken: WorkOSValues.AccessToken) {
        const { exp } = Jose.decodeJwt(accessToken)
        if (exp === undefined) {
          return yield* Effect.die(new UnexpectedError({ message: "JWT is missing expiration" }))
        }

        const expirationInMillis = exp * 1000
        const nowInMillis = yield* Clock.currentTimeMillis

        if (expirationInMillis < nowInMillis) {
          return yield* Effect.fail(new AccessTokenExpiredError({ accessToken }))
        }

        return accessToken
      })

      const staleAccessToken = Effect.gen(function*() {
        const cookieStore = yield* cookiesStoreEffect
        const cookie = cookieStore.get(HTTP_ONLY_COOKIE_NAME)

        if (cookie === undefined) {
          return yield* Effect.fail(new AccessTokenCookieNotFoundError())
        }

        return WorkOSValues.AccessToken.make(cookie.value)
      })

      // const handleAuthenticateSession = Effect.fn(function*(inputAccessToken?: AccessToken) {
      //   const effectiveInputSessionJWT = inputAccessToken ?? (yield* staleAccessToken)

      //   const authenticateResult = yield* serverApiClient.sessions.authenticateSession({
      //     payload: { sessionJWT: effectiveInputSessionJWT }
      //   })

      //   yield* setSessionJWT({ jwt: authenticateResult.sessionJWT })

      //   return authenticateResult
      // })
      // const authenticateSession = Effect.suspend(() => handleAuthenticateSession())

      // const validSessionJWT = pipe(
      //   staleAccessToken,
      //   Effect.flatMap(checkAccessTokenExpiration)
      // )
      // const refreshedSessionJWT = pipe(
      //   validSessionJWT,
      //   Effect.catchTag(
      //     "AccessTokenExpiredError",
      //     ({ accessToken }) =>
      //       pipe(
      //         handleAuthenticateSession(accessToken),
      //         Effect.map(({ sessionJWT }) => sessionJWT)
      //       )
      //   )
      // )

      return { setSessionJWT }
    })
  }
) {}