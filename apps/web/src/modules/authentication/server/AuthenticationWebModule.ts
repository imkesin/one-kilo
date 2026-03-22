import "server-only"

import * as WorkOSValues from "@effect/auth-workos/domain/Values"
import { UserId } from "@one-kilo/domain/ids/UserId"
import { AuthenticationContext } from "@one-kilo/domain/values/AuthenticationContext"
import {
  dieWithUnexpectedError,
  dieWithUnexpectedErrorCallback,
  UnexpectedError
} from "@one-kilo/lib/errors/UnexpectedError"
import * as Cache from "effect/Cache"
import * as Clock from "effect/Clock"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { pipe } from "effect/Function"
import * as Predicate from "effect/Predicate"
import * as RcMap from "effect/RcMap"
import * as S from "effect/Schema"
import * as Jose from "jose"
import { isDynamicServerError as isNextDynamicServerError } from "next/dist/client/components/hooks-server-context"
import { cookies } from "next/headers"
import { ServerApiClient } from "~/infra/api/ServerApiClient"
import { DynamicServerError } from "~/lib/errors"

const AuthenticationContextFromJsonString = S.parseJson(AuthenticationContext)

export class AuthenticationContextCookieNotFoundError extends S.TaggedError<AuthenticationContextCookieNotFoundError>()(
  "AuthenticationContextCookieNotFoundError",
  {},
  {
    description: "The authentication context cookie was not found"
  }
) {}

const HTTP_ONLY_COOKIE_NAME = "one-kilo/web/AuthenticationContext"

export class AuthenticationWebModule extends Effect.Service<AuthenticationWebModule>()(
  "AuthenticationWebModule",
  {
    dependencies: [ServerApiClient.Default],
    scoped: Effect.gen(function*() {
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

      const setAuthenticationContext = Effect.fn(
        function*(authenticationContext: AuthenticationContext) {
          const cookieStore = yield* cookiesStoreEffect
          const encodedAuthenticationContext = yield* pipe(
            authenticationContext,
            S.encode(AuthenticationContextFromJsonString),
            Effect.catchTag(
              "ParseError",
              dieWithUnexpectedErrorCallback("Failed to set authentication context cookie")
            )
          )

          cookieStore.set(
            HTTP_ONLY_COOKIE_NAME,
            encodedAuthenticationContext,
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

      const currentAuthenticationContextEffect = Effect.gen(function*() {
        const cookieStore = yield* cookiesStoreEffect
        const cookie = cookieStore.get(HTTP_ONLY_COOKIE_NAME)

        if (Predicate.isUndefined(cookie)) {
          return yield* Effect.fail(new AuthenticationContextCookieNotFoundError())
        }

        const decodedAuthenticationContext = yield* pipe(
          cookie.value,
          S.decode(AuthenticationContextFromJsonString),
          Effect.tapErrorCause((cause) => Effect.logError("Failed to decode authentication context", cause)),
          Effect.mapError(() => new AuthenticationContextCookieNotFoundError())
        )

        return decodedAuthenticationContext
      })

      const refreshedAuthenticationContextCache = yield* Cache.makeWith({
        capacity: 10,
        lookup: (refreshToken: WorkOSValues.RefreshToken) =>
          pipe(
            serverApiClient.authentication.refreshContext({ payload: { refreshToken } }),
            Effect.map(({ authenticationContext }) => authenticationContext)
          ),
        timeToLive: (exit) =>
          Exit.isFailure(exit)
            ? "50 millis"
            : "5 seconds"
      })

      const refreshTokenLocks = yield* RcMap.make({
        lookup: (_refreshToken: WorkOSValues.RefreshToken) => Effect.makeSemaphore(1),
        idleTimeToLive: "10 seconds"
      })
      const withRefreshTokenLock =
        (refreshToken: WorkOSValues.RefreshToken) => <A, E, R>(effect: Effect.Effect<A, E, R>) =>
          pipe(
            refreshTokenLocks,
            RcMap.get(refreshToken),
            Effect.flatMap((semaphore) =>
              pipe(
                effect,
                semaphore.withPermits(1)
              )
            ),
            Effect.scoped
          )

      const refreshAndSetAuthenticationContext = Effect.fn(
        function*(refreshToken: WorkOSValues.RefreshToken) {
          const authenticationContext = yield* refreshedAuthenticationContextCache.get(refreshToken)

          yield* setAuthenticationContext(authenticationContext)

          return authenticationContext
        },
        (effect, refreshToken) =>
          pipe(
            effect,
            withRefreshTokenLock(refreshToken)
          )
      )

      const userIdLocks = yield* RcMap.make({
        lookup: (_userId: UserId) => Effect.makeSemaphore(1),
        idleTimeToLive: "1 minute"
      })
      const withUserIdLock = (userId: UserId) => <A, E, R>(effect: Effect.Effect<A, E, R>) =>
        pipe(
          userIdLocks,
          RcMap.get(userId),
          Effect.flatMap((semaphore) =>
            pipe(
              effect,
              semaphore.withPermits(1)
            )
          ),
          Effect.scoped
        )

      const lockedMaybeRefreshAuthenticationContext = Effect.fn(
        function*(authenticationContext: AuthenticationContext) {
          const { exp } = Jose.decodeJwt(authenticationContext.workosAccessToken)
          if (Predicate.isUndefined(exp)) {
            return yield* dieWithUnexpectedError("JWT is missing expiration")
          }

          const expirationInMillis = exp * 1000
          const nowInMillis = yield* Clock.currentTimeMillis

          if (expirationInMillis > nowInMillis) {
            return authenticationContext
          }

          return yield* refreshAndSetAuthenticationContext(authenticationContext.workosRefreshToken)
        },
        (effect, { userId }) =>
          pipe(
            effect,
            withUserIdLock(userId)
          )
      )

      const liveAuthenticationContextEffect = pipe(
        currentAuthenticationContextEffect,
        Effect.andThen(lockedMaybeRefreshAuthenticationContext)
      )

      const handleExchangeCode = Effect.fn("AuthenticationWebModule.handleExchangeCode")(
        function*(code: WorkOSValues.AuthenticationCode) {
          const authenticationContext = yield* pipe(
            serverApiClient.authentication.exchangeCode({ payload: { code } }),
            Effect.map(({ authenticationContext }) => authenticationContext)
          )

          yield* setAuthenticationContext(authenticationContext)

          return authenticationContext
        }
      )

      return {
        authenticationContext: liveAuthenticationContextEffect,
        handleExchangeCode
      }
    })
  }
) {}
