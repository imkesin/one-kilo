import * as DevTools from "@effect/experimental/DevTools"
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import * as NodeSocket from "@effect/platform-node/NodeSocket"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { HttpLive } from "./Http.ts"

const DevToolsLive = Layer.provide(
  DevTools.layerWebSocket(),
  NodeSocket.layerWebSocketConstructor
)

pipe(
  HttpLive,
  Layer.provide(DevToolsLive),
  Layer.launch,
  NodeRuntime.runMain
)
