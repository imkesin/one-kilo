import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as OtlpSerialization from "effect/observability/OtlpSerialization"
import * as OtlpTracer from "effect/observability/OtlpTracer"

const DEFAULT_LOCAL_BASE_URL = "http://localhost:4318"

const OtelConfig = pipe(
  Config.all({
    baseUrl: pipe(
      Config.String("EXPORTER_OTLP_ENDPOINT"),
      Config.withDefault(DEFAULT_LOCAL_BASE_URL)
    )
  }),
  Config.nested("OTEL")
)

type TracerLayerParameters = {
  serviceName: string
  serviceVersion: string
}

export const layer = ({
  serviceName,
  serviceVersion
}: TracerLayerParameters): Layer.Layer<never> =>
  pipe(
    Layer.unwrap(
      Effect.gen(function*() {
        const { baseUrl } = yield* OtelConfig

        /*
         * Implicitly extracts `OTEL_RESOURCE_ATTRIBUTES` if it is defined in the environment.
         */
        return OtlpTracer.layer({
          url: `${baseUrl}/v1/traces`,
          resource: {
            serviceName,
            serviceVersion,
            attributes: {
              "service.namespace": "one-kilo"
            }
          }
        })
      })
    ),
    Layer.provide(OtlpSerialization.layerJson),
    Layer.provide(NodeHttpClient.layerUndici),
    Layer.orDie
  )
