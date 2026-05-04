import * as Tracer from "@one-kilo/telemetry/Tracer"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"

const SERVICE_NAME = "runner"

export const TelemetryLive = Layer.unwrapEffect(
  Effect.gen(function*() {
    const serviceVersion = yield* pipe(
      Config.string("SERVICE_VERSION"),
      Config.withDefault("dev")
    )

    return Tracer.layer({
      serviceName: SERVICE_NAME,
      serviceVersion
    })
  })
)
