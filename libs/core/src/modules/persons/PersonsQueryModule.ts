import { PersonsQueryRepository } from "@one-kilo/sql/modules/persons/PersonsQueryRepository"
import * as Effect from "effect/Effect"

export class PersonsQueryModule extends Effect.Service<PersonsQueryModule>()(
  "@one-kilo/core/PersonsQueryModule",
  {
    dependencies: [PersonsQueryRepository.Default],
    effect: Effect.gen(function*() {
      const personsQueryRepository = yield* PersonsQueryRepository

      return {
        retrievePerson: personsQueryRepository.findPersonById,
        retrievePersonEntity: personsQueryRepository.findPersonEntity,
        retrievePersonEntityWithUser: personsQueryRepository.findPersonEntityWithUser
      }
    })
  }
) {}
