import * as Otlp from "@one-kilo/telemetry/Otlp"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"

const SERVICE_NAME = "server"

export const TelemetryLayer = Layer.unwrap(
  Effect.gen(function*() {
    const serviceVersion = yield* pipe(
      Config.String("SERVICE_VERSION"),
      Config.withDefault("dev")
    )

    return Otlp.layer({
      serviceName: SERVICE_NAME,
      serviceVersion
    })
  })
)
