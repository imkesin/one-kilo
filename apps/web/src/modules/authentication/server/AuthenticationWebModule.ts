import type * as WorkOSValues from "@effect/auth-workos/domain/Values"
import type { AccountId } from "@one-kilo/domain/ids/AccountId"
import { AuthenticationContext } from "@one-kilo/domain/values/AuthenticationContext"
import { dieWithUnexpectedError, dieWithUnexpectedErrorCallback } from "@one-kilo/lib/errors/UnexpectedError"
import { getCookie, setCookie } from "@tanstack/react-start/server"
import * as Cache from "effect/Cache"
import * as Clock from "effect/Clock"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Predicate from "effect/Predicate"
import * as RcMap from "effect/RcMap"
import * as S from "effect/Schema"
import * as Semaphore from "effect/Semaphore"
import * as Jose from "jose"
import { AuthenticationServerApiClient } from "~/infra/api/server/ServerApiClients"
import { AuthenticationContextCookieNotFoundError, AuthenticationContextExpiredError } from "./AuthenticationErrors"

const AuthenticationContextFromJsonString = S.fromJsonString(AuthenticationContext)

const HTTP_ONLY_COOKIE_NAME = "one-kilo/web/AuthenticationContext"

export class AuthenticationWebModule extends Context.Service<AuthenticationWebModule>()(
  "@one-kilo/web/AuthenticationWebModule",
  {
    make: Effect.gen(function*() {
      const authenticationClient = yield* AuthenticationServerApiClient

      const setAuthenticationContext = Effect.fn(
        function*(authenticationContext: AuthenticationContext) {
          const encodedAuthenticationContext = yield* pipe(
            authenticationContext,
            S.encodeEffect(AuthenticationContextFromJsonString),
            Effect.catchTag(
              "SchemaError",
              dieWithUnexpectedErrorCallback("Failed to encode authentication context cookie")
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

      const rawAuthenticationContext = Effect.gen(function*() {
        const cookie = getCookie(HTTP_ONLY_COOKIE_NAME)

        if (Predicate.isUndefined(cookie)) {
          return yield* AuthenticationContextCookieNotFoundError.make()
        }

        const decodedAuthenticationContext = yield* pipe(
          cookie,
          S.decodeEffect(AuthenticationContextFromJsonString),
          Effect.tapCause((cause) => Effect.logError("Failed to decode authentication context", cause)),
          Effect.mapError(() => AuthenticationContextCookieNotFoundError.make())
        )

        return decodedAuthenticationContext
      })

      const withValidAuthenticationContextOr = <A, E, R>(
        onExpired: (invalidAuthenticationContextEffect: AuthenticationContext) => Effect.Effect<A, E, R>
      ) =>
        Effect.gen(function*() {
          const authenticationContext = yield* rawAuthenticationContext

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

      const currentAuthenticationContext = withValidAuthenticationContextOr(
        () => AuthenticationContextExpiredError.make()
      )

      const refreshedAuthenticationContextCache = yield* Cache.makeWith(
        (refreshToken: WorkOSValues.RefreshToken) =>
          pipe(
            authenticationClient.authentication.refreshContext({ payload: { refreshToken } }),
            Effect.map(({ authenticationContext }) => authenticationContext)
          ),
        {
          capacity: 10,
          timeToLive: (exit) =>
            Exit.isFailure(exit)
              ? "50 millis"
              : "5 seconds"
        }
      )

      const refreshTokenLocks = yield* RcMap.make({
        lookup: (_refreshToken: WorkOSValues.RefreshToken) => Semaphore.make(1),
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
          const authenticationContext = yield* Cache.get(refreshedAuthenticationContextCache, refreshToken)

          yield* setAuthenticationContext(authenticationContext)

          return authenticationContext
        },
        (effect, refreshToken) =>
          pipe(
            effect,
            withRefreshTokenLock(refreshToken)
          )
      )

      const accountIdLocks = yield* RcMap.make({
        lookup: (_accountId: AccountId) => Semaphore.make(1),
        idleTimeToLive: "1 minute"
      })
      const withAccountIdLock = (accountId: AccountId) => <A, E, R>(effect: Effect.Effect<A, E, R>) =>
        pipe(
          accountIdLocks,
          RcMap.get(accountId),
          Effect.flatMap((semaphore) =>
            pipe(
              effect,
              semaphore.withPermits(1)
            )
          ),
          Effect.scoped
        )

      const refreshedAuthenticationContext = withValidAuthenticationContextOr(({ accountId, workosRefreshToken }) =>
        pipe(
          refreshAndSetAuthenticationContext(workosRefreshToken),
          withAccountIdLock(accountId)
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
        currentAuthenticationContext,
        refreshedAuthenticationContext,

        handleExchangeCode
      }
    })
  }
) {
  static readonly layer = pipe(
    Layer.effect(this, this.make),
    Layer.provide(AuthenticationServerApiClient.layer)
  )
}
