import * as ClusterWorkflowEngine from "@effect/cluster/ClusterWorkflowEngine"
import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import * as PgLayers from "@one-kilo/sql/PgLayers"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { AliveCron } from "./crons/AliveCron.ts"
import { WorkOSLayer } from "./infra/WorkOS.ts"
import * as PushPersonChangeToWorkOS from "./workflows/PushPersonChangeToWorkOS.ts"

const SqlLayer = PgLayers.layer()

const RunnerInfraLayer = pipe(
  Layer.merge(SqlLayer, WorkOSLayer),
  Layer.provide(NodeHttpClient.layerUndici)
)
export function makeRunnerLayer<A, E, R>(ClusterLayer: Layer.Layer<A, E, R>) {
  const CronsLayer = pipe(
    Layer.mergeAll(AliveCron),
    Layer.provide(ClusterLayer)
  )

  const WorkflowEngineLayer = Layer.provide(
    ClusterWorkflowEngine.layer,
    ClusterLayer
  )

  const WorkflowsLayer = pipe(
    Layer.mergeAll(PushPersonChangeToWorkOS.WorkflowLayer),
    Layer.provide(WorkflowEngineLayer)
  )

  return pipe(
    Layer.mergeAll(CronsLayer, WorkflowsLayer),
    Layer.provide(RunnerInfraLayer)
  )
}
