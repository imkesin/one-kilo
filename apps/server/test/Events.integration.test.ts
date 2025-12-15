import { describe, layer } from "@effect/vitest"
import { Effect, Layer, Logger, pipe } from "effect"
import { WorkOSClient } from "../src/WorkOSClient.ts"

const integrationTestLayer = pipe(
  WorkOSClient.Default,
  Layer.provide(Logger.pretty)
)

describe("Events - Integration", () => {
  layer(integrationTestLayer, { excludeTestServices: true })((it) => {
    it.effect("can list events", () =>
      Effect.gen(function*() {
        const { use } = yield* WorkOSClient

        const listOfEvents = yield* pipe(
          use((client) =>
            client.events.listEvents({
              limit: 10,
              events: [
                "dsync.activated",
                "dsync.deleted",
                "dsync.user.created",
                "dsync.user.updated",
                "dsync.user.deleted"
              ]
            })
          )
        )

        yield* Effect.log(JSON.stringify(listOfEvents, null, 2))
      }))
  })
})
