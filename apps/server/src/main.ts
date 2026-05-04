import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { HttpLive } from "./Http.ts"
import { TelemetryLive } from "./infra/Telemetry.ts"

pipe(
  HttpLive,
  Layer.provide(TelemetryLive),
  Layer.launch,
  NodeRuntime.runMain
)
