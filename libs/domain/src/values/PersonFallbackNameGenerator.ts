import { UnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Arr from "effect/Array"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Random from "effect/Random"
import * as Record from "effect/Record"
import { FullName, PreferredName } from "./PersonValues.js"

const ANIMAL_ADJECTIVE_LOOKUP = {
  B: {
    animals: ["Bear", "Beaver"],
    adjectives: ["Benevolent", "Brave"]
  },
  E: {
    animals: ["Eagle", "Elephant"],
    adjectives: ["Energetic", "Enlightened"]
  },
  F: {
    animals: ["Falcon", "Fox"],
    adjectives: ["Friendly", "Fearless"]
  },
  P: {
    animals: ["Panda", "Panther"],
    adjectives: ["Patient", "Playful"]
  },
  T: {
    animals: ["Tiger", "Tortoise"],
    adjectives: ["Timeless", "Thriving"]
  }
} as const

export class PersonFallbackNameGenerator extends Effect.Service<PersonFallbackNameGenerator>()(
  "@one-kilo/domain/PersonFallbackNameGenerator",
  {
    sync: () => {
      const animalAdjectiveClusters = Record.values(ANIMAL_ADJECTIVE_LOOKUP)

      if (!Arr.isNonEmptyReadonlyArray(animalAdjectiveClusters)) {
        throw new UnexpectedError({ message: "No animal adjective clusters found" })
      }

      const generate = Effect.gen(function*() {
        const [
          animal,
          adjective
        ] = yield* pipe(
          Random.choice(animalAdjectiveClusters),
          Effect.flatMap(({ animals, adjectives }) =>
            Effect.all([
              Random.choice(animals),
              Random.choice(adjectives)
            ])
          )
        )

        return {
          fallbackPreferredName: PreferredName.make("Anonymous"),
          fallbackFullName: FullName.make(`Anonymous ${adjective} ${animal}`),
          fallbackWorkosName: {
            firstName: "Anonymous" as const,
            lastName: `${adjective} ${animal}`
          }
        }
      })

      return { generate }
    }
  }
) {}
