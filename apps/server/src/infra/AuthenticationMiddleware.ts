import * as WorkOSValues from "@effect/auth-workos/domain/Values"
import * as TokenClient from "@effect/auth-workos/TokenClient"
import { AuthenticationMiddleware, UnauthenticatedError } from "@one-kilo/server-api/infra/AuthenticationSecurity"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as Redacted from "effect/Redacted"
import { AuthenticationQueryModule } from "../modules/authentication/AuthenticationQueryModule.ts"

export const AuthenticationMiddlewareLive = pipe(
  Layer.effect(
    AuthenticationMiddleware,
    Effect.gen(function*() {
      const workosTokenClient = yield* TokenClient.TokenClient
      const authenticationQueryModule = yield* AuthenticationQueryModule

      return AuthenticationMiddleware.of({
        jwt: Effect.fn("AuthenticationMiddleware.jwt")(function*(bearerToken) {
          const decodedAccessToken = yield* pipe(
            workosTokenClient.verifyAccessToken(WorkOSValues.AccessToken.make(Redacted.value(bearerToken))),
            Effect.tapErrorCause(Effect.logError),
            Effect.orElseFail(() => new UnauthenticatedError())
          )

          if (
            decodedAccessToken._tag === "DecodedMachineAccessToken"
            || Option.isNone(decodedAccessToken.orgId)
          ) {
            return yield* new UnauthenticatedError()
          }

          return yield* pipe(
            authenticationQueryModule.retrieveAuthenticationIdentity({
              workosUserId: decodedAccessToken.sub,
              workosOrganizationId: decodedAccessToken.orgId.value
            }),
            Effect.flatMap(
              Option.match({
                onNone: () => Effect.fail(new UnauthenticatedError()),
                onSome: Effect.succeed
              })
            )
          )
        })
      })
    })
  ),
  Layer.provide(AuthenticationQueryModule.Default)
)
