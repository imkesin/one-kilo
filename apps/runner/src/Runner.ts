import * as ClusterWorkflowEngine from "@effect/cluster/ClusterWorkflowEngine"
import * as RunnerAddress from "@effect/cluster/RunnerAddress"
import * as NodeClusterSocket from "@effect/platform-node/NodeClusterSocket"
import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import * as PgLayers from "@one-kilo/sql/PgLayers"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import { AliveCron } from "./crons/AliveCron.ts"
import { WorkOSLive } from "./infra/WorkOS.ts"
import { SyncPersonToWorkOSLive } from "./workflows/PersonsWorkflows.ts"

const SqlLive = PgLayers.layer()
const RunnerInfraLive = pipe(
  Layer.merge(SqlLive, WorkOSLive),
  Layer.provide(NodeHttpClient.layerUndici)
)

const RunnerConfig = pipe(
  Config.all({
    host: Config.withDefault(Config.string("HOST"), "localhost"),
    port: Config.withDefault(Config.number("PORT"), 12000)
  }),
  Config.nested("RUNNER")
)
const ClusterLive = pipe(
  Effect.gen(function*() {
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
  }),
  Layer.unwrapEffect
)

const CronsLive = pipe(
  Layer.mergeAll(AliveCron),
  Layer.provide(ClusterLive)
)

const WorkflowEngineLive = Layer.provide(
  ClusterWorkflowEngine.layer,
  ClusterLive
)

const WorkflowsLive = pipe(
  Layer.mergeAll(SyncPersonToWorkOSLive),
  Layer.provide(WorkflowEngineLive)
)

export const RunnerLive = pipe(
  Layer.mergeAll(
    CronsLive,
    WorkflowsLive
  ),
  Layer.provide(RunnerInfraLive)
)
