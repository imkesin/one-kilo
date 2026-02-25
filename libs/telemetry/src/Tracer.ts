import * as OtlpSerialization from "@effect/opentelemetry/OtlpSerialization"
import * as OtlpTracer from "@effect/opentelemetry/OtlpTracer"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Redacted from "effect/Redacted"

const HoneycombConfig = Config.nested(
  Config.all({
    apiKey: pipe(
      Config.string("API_KEY"),
      (_) => Config.redacted(_)
    ),
    dataset: pipe(
      Config.string("DATASET"),
      Config.withDefault("effect-workos.integration")
    )
  }),
  "HONEYCOMB"
)

export const TracerLive = pipe(
  Layer.unwrapEffect(
    Effect.gen(function*() {
      const honeycombConfig = yield* HoneycombConfig

      return OtlpTracer.layer({
        url: "https://api.honeycomb.io/v1/traces",
        resource: {
          serviceName: honeycombConfig.dataset
        },
        headers: {
          "x-honeycomb-team": Redacted.value(honeycombConfig.apiKey),
          "x-honeycomb-dataset": honeycombConfig.dataset
        }
      })
    })
  ),
  Layer.provide(OtlpSerialization.layerJson)
)
