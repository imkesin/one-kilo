import * as NodeClusterHttp from "@effect/platform-node/NodeClusterHttp"

export const ClusterClientLayer = NodeClusterHttp.layer({
  transport: "http",
  serialization: "binary",
  storage: "sql",
  clientOnly: true
})
