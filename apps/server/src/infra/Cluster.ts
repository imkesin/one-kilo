import * as ClusterWorkflowEngine from "@effect/cluster/ClusterWorkflowEngine"
import * as NodeClusterHttp from "@effect/platform-node/NodeClusterHttp"
import * as Layer from "effect/Layer"

const ClusterClientLive = NodeClusterHttp.layer({
  transport: "http",
  serialization: "msgpack",
  storage: "sql",
  clientOnly: true
})

export const WorkflowEngineLive = Layer.provide(
  ClusterWorkflowEngine.layer,
  ClusterClientLive
)
