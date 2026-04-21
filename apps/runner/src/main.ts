import * as ClusterCron from "@effect/cluster/ClusterCron"
import * as RunnerAddress from "@effect/cluster/RunnerAddress"
import * as NodeClusterSocket from "@effect/platform-node/NodeClusterSocket"
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import * as PgLayers from "@one-kilo/sql/PgLayers"
import * as Config from "effect/Config"
import * as Cron from "effect/Cron"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"

const SqlLive = PgLayers.layer()

const RunnerConfig = pipe(
  Config.all({
    host: Config.withDefault(Config.string("HOST"), "localhost"),
    port: Config.withDefault(Config.number("PORT"), 12000)
  }),
  Config.nested("RUNNER")
)

const ClusterLive = Effect.gen(function*() {
  const runnerAddress = yield* Effect.map(
    RunnerConfig,
    ({ host, port }) => RunnerAddress.make(host, port)
  )

  return NodeClusterSocket.layer({
    serialization: "ndjson",
    storage: "sql",
    shardingConfig: {
      runnerAddress: Option.some(runnerAddress)
    }
  })
}).pipe(
  Layer.unwrapEffect,
  Layer.provide(SqlLive)
)

const AliveCron = ClusterCron.make({
  name: "runner-alive",
  cron: Cron.unsafeParse("* * * * *"),
  execute: Effect.log("Runner cron: cluster is alive")
})

const AppLive = AliveCron.pipe(Layer.provide(ClusterLive))

NodeRuntime.runMain(Layer.launch(AppLive))
