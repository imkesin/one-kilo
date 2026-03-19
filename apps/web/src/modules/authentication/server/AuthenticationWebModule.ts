import * as WorkOSValues from "@effect/auth-workos/domain/Values"
import { AuthenticationContext } from "@one-kilo/domain/values/AuthenticationContext"
import { dieWithUnexpectedErrorCallback, UnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Clock from "effect/Clock"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as Jose from "jose"
import { isDynamicServerError as isNextDynamicServerError } from "next/dist/client/components/hooks-server-context"
import { cookies } from "next/headers"
import { ServerApiClient } from "~/infra/api/ServerApiClient"
import { DynamicServerError } from "~/lib/errors"

const AuthenticationContextFromJsonString = S.parseJson(AuthenticationContext)

// TODO => Rename these
export class AccessTokenCookieNotFoundError extends S.TaggedError<AccessTokenCookieNotFoundError>()(
  "AccessTokenCookieNotFoundError",
  {},
  {
    description: "An access token cookie was not found"
  }
) {}

// TODO => Rename these
export class AccessTokenExpiredError extends S.TaggedError<AccessTokenExpiredError>()(
  "AccessTokenExpiredError",
  {
    accessToken: WorkOSValues.AccessToken
  },
  {
    description: "The access token is expired"
  }
) {}

const HTTP_ONLY_COOKIE_NAME = "one-kilo/web/AuthenticationContext"

export class AuthenticationWebModule extends Effect.Service<AuthenticationWebModule>()(
  "AuthenticationWebModule",
  {
    dependencies: [ServerApiClient.Default],
    effect: Effect.gen(function*() {
      const { client: serverApiClient } = yield* ServerApiClient

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

      const rawAuthenticationContextEffect = Effect.gen(function*() {
        const cookieStore = yield* cookiesStoreEffect
        const cookie = cookieStore.get(HTTP_ONLY_COOKIE_NAME)

        if (cookie === undefined) {
          return yield* Effect.fail(new AccessTokenCookieNotFoundError())
        }

        const decodedAuthenticationContext = yield* pipe(
          cookie.value,
          S.decode(AuthenticationContextFromJsonString),
          Effect.tapErrorCause((cause) => Effect.logError("Failed to decode authentication context", cause)),
          Effect.mapError(() => new AccessTokenCookieNotFoundError())
        )

        return decodedAuthenticationContext
      })

      const _checkAccessTokenExpiration = Effect.fn(function*(accessToken: WorkOSValues.AccessToken) {
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

      const _getAuthenticationContext = Effect.fn(function*() {
        const _rawContext = yield* rawAuthenticationContextEffect

        // If invalid, then refresh

        // Otherwise, fall through and give the context
      })

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

      return { handleExchangeCode }
    })
  }
) {}
