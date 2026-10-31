import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import * as PgLayers from "@one-kilo/sql/PgLayers"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { AliveCron } from "./crons/AliveCron.ts"
import { WorkOSLayer } from "./infra/WorkOS.ts"
import { PersonToWorkOSOutboxHandlers } from "./mailboxes/PersonToWorkOSOutboxHandlers.ts"

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

  const EntitiesLayer = pipe(
    Layer.mergeAll(PersonToWorkOSOutboxHandlers),
    Layer.provide(ClusterLayer)
  )

  return pipe(
    Layer.mergeAll(CronsLayer, EntitiesLayer),
    Layer.provide(RunnerInfraLayer)
  )
}
