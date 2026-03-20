import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { HttpLive } from "./Http.ts"

pipe(
  HttpLive,
  Layer.launch,
  NodeRuntime.runMain
)
