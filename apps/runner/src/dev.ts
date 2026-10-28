import * as NodeClusterHttp from "@effect/platform-node/NodeClusterHttp"
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import * as RunnerAddress from "effect/cluster/RunnerAddress"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import { TelemetryLayer } from "./infra/Telemetry.ts"
import { makeRunnerLayer } from "./Runner.ts"

const RunnerConfig = pipe(
  Config.all({
    host: pipe(
      Config.String("HOST"),
      Config.withDefault("localhost")
    ),
    port: pipe(
      Config.Number("PORT"),
      Config.withDefault(12000)
    )
  }),
  Config.nested("RUNNER")
)

const ClusterLayer = pipe(
  Effect.gen(function*() {
    const config = yield* RunnerConfig

    return NodeClusterHttp.layer({
      transport: "http",
      serialization: "binary",
      storage: "sql",
      runnerHealth: "ping",
      shardingConfig: {
        runnerAddress: Option.some(RunnerAddress.make(config.host, config.port))
      }
    })
  }),
  Layer.unwrap
)

const RunnerLayer = makeRunnerLayer(ClusterLayer)

pipe(
  RunnerLayer,
  Layer.provide(TelemetryLayer),
  Layer.launch,
  NodeRuntime.runMain
)
