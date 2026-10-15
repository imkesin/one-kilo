import { ActorQueryRepository } from "@one-kilo/sql/modules/actor/ActorQueryRepository"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"

export class ActorQueryModule extends Context.Service<ActorQueryModule>()(
  "@one-kilo/core/ActorQueryModule",
  {
    make: Effect.gen(function*() {
      const actorQueryRepository = yield* ActorQueryRepository

      return {
        retrieveActorIdentity: actorQueryRepository.findActorIdentity
      }
    })
  }
) {
  static readonly layer = pipe(
    Layer.effect(this, this.make),
    Layer.provide(ActorQueryRepository.layer)
  )
}
