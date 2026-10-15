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
    host: Config.String("HOST"),
    port: pipe(
      Config.Number("PORT"),
      Config.withDefault(12000)
    ),
    k8sNamespace: Config.String("K8S_NAMESPACE"),
    k8sLabelSelector: pipe(
      Config.String("K8S_LABEL_SELECTOR"),
      Config.withDefault("app=runner")
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
  Layer.unwrap
)

const RunnerLayer = makeRunnerLayer(ClusterLayer)

pipe(
  RunnerLayer,
  Layer.provide(TelemetryLayer),
  Layer.launch,
  NodeRuntime.runMain
)
