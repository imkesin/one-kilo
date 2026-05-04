import * as RunnerAddress from "@effect/cluster/RunnerAddress"
import * as NodeClusterHttp from "@effect/platform-node/NodeClusterHttp"
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import { TelemetryLive } from "./infra/Telemetry.ts"
import { makeRunnerLive } from "./Runner.ts"

const RunnerConfig = pipe(
  Config.all({
    host: Config.string("HOST"),
    port: pipe(
      Config.number("PORT"),
      Config.withDefault(12000)
    ),
    k8sNamespace: Config.string("K8S_NAMESPACE"),
    k8sLabelSelector: pipe(
      Config.string("K8S_LABEL_SELECTOR"),
      Config.withDefault("app=runner")
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
      runnerHealth: "k8s",
      runnerHealthK8s: {
        namespace: config.k8sNamespace,
        labelSelector: config.k8sLabelSelector
      },
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
  Layer.provide(TelemetryLive),
  Layer.launch,
  NodeRuntime.runMain
)
