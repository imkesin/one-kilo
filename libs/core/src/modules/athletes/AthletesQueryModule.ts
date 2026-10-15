import { AthletesQueryRepository } from "@one-kilo/sql/modules/athletes/AthletesQueryRepository"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"

export class AthletesQueryModule extends Context.Service<AthletesQueryModule>()(
  "@one-kilo/core/AthletesQueryModule",
  {
    make: Effect.gen(function*() {
      const athletesQueryRepository = yield* AthletesQueryRepository

      return {
        retrieveAthlete: athletesQueryRepository.findAthleteById,
        retrieveAthleteEntityByPersonId: athletesQueryRepository.findAthleteEntityByPersonId
      }
    })
  }
) {
  static readonly layer = pipe(
    Layer.effect(this, this.make),
    Layer.provide(AthletesQueryRepository.layer)
  )
}
