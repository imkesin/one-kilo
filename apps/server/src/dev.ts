import * as DevTools from "@effect/experimental/DevTools"
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import * as NodeSocket from "@effect/platform-node/NodeSocket"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { HttpLayer } from "./Http.ts"

const DevToolsLayer = Layer.provide(
  DevTools.layerWebSocket(),
  NodeSocket.layerWebSocketConstructor
)

pipe(
  HttpLayer,
  Layer.provide(DevToolsLayer),
  Layer.launch,
  NodeRuntime.runMain
)
