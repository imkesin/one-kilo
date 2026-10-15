import * as NodeClusterHttp from "@effect/platform-node/NodeClusterHttp"
import * as ClusterWorkflowEngine from "effect/cluster/ClusterWorkflowEngine"
import * as Layer from "effect/Layer"

const ClusterClientLayer = NodeClusterHttp.layer({
  transport: "http",
  serialization: "binary",
  storage: "sql",
  clientOnly: true
})

export const WorkflowEngineLayer = Layer.provide(
  ClusterWorkflowEngine.layer,
  ClusterClientLayer
)
