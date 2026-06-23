import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import { AthletesQueryModule } from "@one-kilo/core/modules/athletes/AthletesQueryModule"
import { AthletesUseCases, RegisterAthleteOutcome } from "@one-kilo/core/processes/athletes/AthletesUseCases"
import { dieWithUnexpectedErrorCallback } from "@one-kilo/lib/errors/UnexpectedError"
import { AthletesApi_RegisterSchemas } from "@one-kilo/server-api/modules/athletes/AthletesApiSchemas"
import { ServerApi } from "@one-kilo/server-api/ServerApi"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"

export const AthletesHttp = pipe(
  HttpApiBuilder.group(
    ServerApi,
    "athletes",
    Effect.fn(function*(handlers) {
      const athletesUseCases = yield* AthletesUseCases
      const athletesQueryModule = yield* AthletesQueryModule

      return handlers
        .handle(
          "register",
          Effect.fn(function*({ payload }) {
            const outcome = yield* pipe(
              athletesUseCases.registerAthlete({ personId: payload.person.id }),
              Effect.catchTags({
                PermissionsError: () => Effect.fail(AthletesApi_RegisterSchemas.Error.Forbidden.make()),
                PersonNotFoundError: () => Effect.fail(AthletesApi_RegisterSchemas.Error.PersonNotFound.make())
              })
            )

            const athlete = yield* pipe(
              athletesQueryModule.retrieveAthlete({ athleteId: outcome.athlete.id }),
              Effect.flatMap(
                Option.match({
                  onNone: dieWithUnexpectedErrorCallback("Failed to load the athlete aggregate after registration"),
                  onSome: Effect.succeed
                })
              )
            )

            return RegisterAthleteOutcome.$match(
              outcome,
              {
                Registered: () => AthletesApi_RegisterSchemas.Registered.fromDomain(athlete),
                AlreadyRegistered: () => AthletesApi_RegisterSchemas.AlreadyRegistered.fromDomain(athlete)
              }
            )
          })
        )
    })
  ),
  Layer.provide([AthletesUseCases.Default, AthletesQueryModule.Default])
)
