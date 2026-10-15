import { PersonsQueryRepository } from "@one-kilo/sql/modules/persons/PersonsQueryRepository"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"

export class PersonsQueryModule extends Context.Service<PersonsQueryModule>()(
  "@one-kilo/core/PersonsQueryModule",
  {
    make: Effect.gen(function*() {
      const personsQueryRepository = yield* PersonsQueryRepository

      return {
        retrievePerson: personsQueryRepository.findPersonById,
        retrievePersonEntity: personsQueryRepository.findPersonEntity,
        retrievePersonEntityWithAccount: personsQueryRepository.findPersonEntityWithAccount
      }
    })
  }
) {
  static readonly layer = pipe(
    Layer.effect(this, this.make),
    Layer.provide(PersonsQueryRepository.layer)
  )
}
