import * as ClusterWorkflowEngine from "@effect/cluster/ClusterWorkflowEngine"
import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import * as PgLayers from "@one-kilo/sql/PgLayers"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { AliveCron } from "./crons/AliveCron.ts"
import { WorkOSLive } from "./infra/WorkOS.ts"
import { SyncPersonToWorkOSLive } from "./workflows/PersonsWorkflows.ts"

const SqlLive = PgLayers.layer()

const RunnerInfraLive = pipe(
  Layer.merge(SqlLive, WorkOSLive),
  Layer.provide(NodeHttpClient.layerUndici)
)
export function makeRunnerLive<A, E, R>(ClusterLayer: Layer.Layer<A, E, R>) {
  const CronsLive = pipe(
    Layer.mergeAll(AliveCron),
    Layer.provide(ClusterLayer)
  )

  const WorkflowEngineLive = Layer.provide(
    ClusterWorkflowEngine.layer,
    ClusterLayer
  )

  const WorkflowsLive = pipe(
    Layer.mergeAll(SyncPersonToWorkOSLive),
    Layer.provide(WorkflowEngineLive)
  )

  return pipe(
    Layer.mergeAll(CronsLive, WorkflowsLive),
    Layer.provide(RunnerInfraLive)
  )
}
