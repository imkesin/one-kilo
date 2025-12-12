import { describe, layer } from "@effect/vitest"
import { Effect, pipe } from "effect"
import { WorkOSClient } from "../src/WorkOSClient.ts"

const integrationTestLayer = WorkOSClient.Default

describe("Audit Logs - Integration", () => {
  layer(integrationTestLayer, { excludeTestServices: true })((it) => {
    it.effect("can send an audit log", () =>
      Effect.gen(function*() {
        const { use } = yield* WorkOSClient

        yield* pipe(
          use((client) =>
            client.auditLogs.createEvent(
              "org_01KC2CF54VMR522NPV4DXM62WC",
              {
                version: 1,
                action: "user.moved",
                actor: {
                  id: "user_01KBR94SFAP9GYFF9JTEWVG56Z",
                  type: "user"
                },
                targets: [
                  {
                    id: "loc_1",
                    type: "location",
                    name: "No Where"
                  }
                ],
                occurredAt: new Date(),
                context: {
                  location: "99.109.54.16"
                }
              }
            )
          )
        )
      }))
  })
})
