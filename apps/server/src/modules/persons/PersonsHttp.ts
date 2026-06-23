import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import { PersonsQueryModule } from "@one-kilo/core/modules/persons/PersonsQueryModule"
import { PersonsUseCases } from "@one-kilo/core/processes/persons/PersonsUseCases"
import { dieWithUnexpectedErrorCallback } from "@one-kilo/lib/errors/UnexpectedError"
import { PersonsApi_UpdateSchemas } from "@one-kilo/server-api/modules/persons/PersonsApiSchemas"
import { ServerApi } from "@one-kilo/server-api/ServerApi"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"

export const PersonsHttp = pipe(
  HttpApiBuilder.group(
    ServerApi,
    "persons",
    Effect.fn(function*(handlers) {
      const personsUseCases = yield* PersonsUseCases
      const personsQueryModule = yield* PersonsQueryModule

      return handlers
        .handle(
          "update",
          Effect.fn(function*({ path, payload }) {
            yield* pipe(
              personsUseCases.update({ personId: path.personId, fields: payload }),
              Effect.catchTags({
                PermissionsError: () => Effect.fail(PersonsApi_UpdateSchemas.Error.Forbidden.make()),
                PersonNotFoundError: () => Effect.fail(PersonsApi_UpdateSchemas.Error.PersonNotFound.make())
              })
            )

            const person = yield* pipe(
              personsQueryModule.retrievePerson({ personId: path.personId }),
              Effect.flatMap(
                Option.match({
                  onNone: dieWithUnexpectedErrorCallback("Failed to load the person aggregate after update"),
                  onSome: Effect.succeed
                })
              )
            )

            return PersonsApi_UpdateSchemas.Updated.fromDomain(person)
          })
        )
    })
  ),
  Layer.provide([
    PersonsUseCases.Default,
    PersonsQueryModule.Default
  ])
)
