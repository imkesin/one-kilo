import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { HttpLayer } from "./Http.ts"
import { TelemetryLayer } from "./infra/Telemetry.ts"

pipe(
  HttpLayer,
  Layer.provide(TelemetryLayer),
  Layer.launch,
  NodeRuntime.runMain
)
