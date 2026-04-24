import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { RunnerLive } from "./Runner.ts"

pipe(
  RunnerLive,
  Layer.launch,
  NodeRuntime.runMain
)
