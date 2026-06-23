import { AthletesQueryRepository } from "@one-kilo/sql/modules/athletes/AthletesQueryRepository"
import * as Effect from "effect/Effect"

export class AthletesQueryModule extends Effect.Service<AthletesQueryModule>()(
  "@one-kilo/core/AthletesQueryModule",
  {
    dependencies: [AthletesQueryRepository.Default],
    effect: Effect.gen(function*() {
      const athletesQueryRepository = yield* AthletesQueryRepository

      return {
        retrieveAthlete: athletesQueryRepository.findAthleteById,
        retrieveAthleteEntityByPersonId: athletesQueryRepository.findAthleteEntityByPersonId
      }
    })
  }
) {}
