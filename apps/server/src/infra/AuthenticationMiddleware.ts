import * as WorkOSValues from "@effect/auth-workos/domain/Values"
import * as TokenClient from "@effect/auth-workos/TokenClient"
import { ActorQueryModule } from "@one-kilo/core/modules/actor/ActorQueryModule"
import { Actor } from "@one-kilo/domain/tags/Actor"
import { AuthenticationMiddleware, UnauthenticatedError } from "@one-kilo/server-api/infra/AuthenticationSecurity"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as Redacted from "effect/Redacted"
import * as S from "effect/Schema"

export const AuthenticationMiddlewareLayer = pipe(
  Layer.effect(
    AuthenticationMiddleware,
    Effect.gen(function*() {
      const workosTokenClient = yield* TokenClient.TokenClient

      const actorQueryModule = yield* ActorQueryModule

      const resolveActor = Effect.fn("AuthenticationMiddleware.jwt")(function*(bearerToken: Redacted.Redacted) {
        const decodedAccessToken = yield* pipe(
          Redacted.value(bearerToken),
          S.decodeEffect(WorkOSValues.AccessToken),
          Effect.flatMap(workosTokenClient.verifyAccessToken),
          Effect.tapCause(Effect.logError),
          Effect.mapError(() => UnauthenticatedError.make())
        )

        if (
          decodedAccessToken._tag === "DecodedMachineAccessToken"
          || Option.isNone(decodedAccessToken.orgId)
        ) {
          return yield* UnauthenticatedError.make()
        }

        const actorIdentity = yield* pipe(
          actorQueryModule.retrieveActorIdentity({
            workosUserId: decodedAccessToken.sub,
            workosOrganizationId: decodedAccessToken.orgId.value
          }),
          Effect.flatMap(
            Option.match({
              onNone: () => Effect.fail(UnauthenticatedError.make()),
              onSome: Effect.succeed
            })
          )
        )

        return Actor.of({
          ...actorIdentity,
          permissions: new Set()
        })
      })

      return AuthenticationMiddleware.of({
        jwt: (httpEffect, { credential }) => Effect.provideServiceEffect(httpEffect, Actor, resolveActor(credential))
      })
    })
  ),
  Layer.provide(ActorQueryModule.layer)
)
