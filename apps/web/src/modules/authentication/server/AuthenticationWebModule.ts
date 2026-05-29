import type * as WorkOSValues from "@effect/auth-workos/domain/Values"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import { AuthenticationContext } from "@one-kilo/domain/values/AuthenticationContext"
import { dieWithUnexpectedError, dieWithUnexpectedErrorCallback } from "@one-kilo/lib/errors/UnexpectedError"
import { getCookie, setCookie } from "@tanstack/react-start/server"
import * as Cache from "effect/Cache"
import * as Clock from "effect/Clock"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { pipe } from "effect/Function"
import * as Predicate from "effect/Predicate"
import * as RcMap from "effect/RcMap"
import * as S from "effect/Schema"
import * as Jose from "jose"
import { AuthenticationServerApiClient } from "~/infra/api/server/ServerApiClients"
import { Authentication_ContextCookieNotFoundError, Authentication_ContextExpiredError } from "./AuthenticationErrors"

const AuthenticationContextFromJsonString = S.parseJson(AuthenticationContext)

const HTTP_ONLY_COOKIE_NAME = "one-kilo/web/AuthenticationContext"

export class AuthenticationWebModule extends Effect.Service<AuthenticationWebModule>()(
  "AuthenticationWebModule",
  {
    dependencies: [AuthenticationServerApiClient.Default],
    scoped: Effect.gen(function*() {
      const authenticationClient = yield* AuthenticationServerApiClient

      const setAuthenticationContext = Effect.fn(
        function*(authenticationContext: AuthenticationContext) {
          const encodedAuthenticationContext = yield* pipe(
            authenticationContext,
            S.encode(AuthenticationContextFromJsonString),
            Effect.catchTag(
              "ParseError",
              dieWithUnexpectedErrorCallback("Failed to set authentication context cookie")
            )
          )

          setCookie(
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

      const rawAuthenticationContextEffect = Effect.gen(function*() {
        const cookie = getCookie(HTTP_ONLY_COOKIE_NAME)

        if (Predicate.isUndefined(cookie)) {
          return yield* Authentication_ContextCookieNotFoundError.make()
        }

        const decodedAuthenticationContext = yield* pipe(
          cookie,
          S.decode(AuthenticationContextFromJsonString),
          Effect.tapErrorCause((cause) => Effect.logError("Failed to decode authentication context", cause)),
          Effect.mapError(Authentication_ContextCookieNotFoundError.make)
        )

        return decodedAuthenticationContext
      })

      const withValidAuthenticationContextOr = <A, E, R>(
        onExpired: (invalidAuthenticationContextEffect: AuthenticationContext) => Effect.Effect<A, E, R>
      ) =>
        Effect.gen(function*() {
          const authenticationContext = yield* rawAuthenticationContextEffect

          const { exp } = Jose.decodeJwt(authenticationContext.workosAccessToken)
          if (Predicate.isUndefined(exp)) {
            return yield* dieWithUnexpectedError("JWT is missing expiration")
          }

          const nowInMillis = yield* Clock.currentTimeMillis
          const expirationInMillis = exp * 1000

          if (nowInMillis < expirationInMillis) {
            return authenticationContext
          }

          return yield* onExpired(authenticationContext)
        })

      const currentAuthenticationContextEffect = withValidAuthenticationContextOr(
        () => Effect.fail(Authentication_ContextExpiredError.make())
      )

      const refreshedAuthenticationContextCache = yield* Cache.makeWith({
        capacity: 10,
        lookup: (refreshToken: WorkOSValues.RefreshToken) =>
          pipe(
            authenticationClient.authentication.refreshContext({ payload: { refreshToken } }),
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

      const refreshedAuthenticationContextEffect = withValidAuthenticationContextOr(({ userId, workosRefreshToken }) =>
        pipe(
          refreshAndSetAuthenticationContext(workosRefreshToken),
          withUserIdLock(userId)
        )
      )

      const handleExchangeCode = Effect.fn("AuthenticationWebModule.handleExchangeCode")(
        function*(code: WorkOSValues.AuthenticationCode) {
          const authenticationContext = yield* pipe(
            authenticationClient.authentication.exchangeCode({ payload: { code } }),
            Effect.map(({ authenticationContext }) => authenticationContext)
          )

          yield* setAuthenticationContext(authenticationContext)

          return authenticationContext
        }
      )

      return {
        currentAuthenticationContext: currentAuthenticationContextEffect,
        refreshedAuthenticationContext: refreshedAuthenticationContextEffect,

        handleExchangeCode
      }
    })
  }
) {}
