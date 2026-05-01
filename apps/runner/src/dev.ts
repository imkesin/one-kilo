import * as RunnerAddress from "@effect/cluster/RunnerAddress"
import * as NodeClusterHttp from "@effect/platform-node/NodeClusterHttp"
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import { makeRunnerLive } from "./Runner.ts"

const RunnerConfig = pipe(
  Config.all({
    host: pipe(
      Config.string("HOST"),
      Config.withDefault("localhost")
    ),
    port: pipe(
      Config.number("PORT"),
      Config.withDefault(12000)
    )
  }),
  Config.nested("RUNNER")
)

const ClusterLive = pipe(
  Effect.gen(function*() {
    const config = yield* RunnerConfig

    return NodeClusterHttp.layer({
      transport: "http",
      serialization: "msgpack",
      storage: "sql",
      runnerHealth: "ping",
      shardingConfig: {
        runnerAddress: Option.some(RunnerAddress.make(config.host, config.port))
      }
    })
  }),
  Layer.unwrapEffect
)

const RunnerLive = makeRunnerLive(ClusterLive)

pipe(
  RunnerLive,
  Layer.launch,
  NodeRuntime.runMain
)
