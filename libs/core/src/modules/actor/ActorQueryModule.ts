import { ActorQueryRepository } from "@one-kilo/sql/modules/actor/ActorQueryRepository"
import * as Effect from "effect/Effect"

export class ActorQueryModule extends Effect.Service<ActorQueryModule>()(
  "@one-kilo/server/ActorQueryModule",
  {
    dependencies: [ActorQueryRepository.Default],
    effect: Effect.gen(function*() {
      const actorQueryRepository = yield* ActorQueryRepository

      return {
        retrieveActorIdentity: actorQueryRepository.findActorIdentity
      }
    })
  }
) {}
