import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Otlp from "effect/observability/Otlp"
import { OtlpDefaults } from "./configs/Defaults.ts"

const OtelConfig = pipe(
  Config.all({
    baseUrl: pipe(
      Config.String("EXPORTER_OTLP_ENDPOINT"),
      Config.withDefault(`http://${OtlpDefaults.host}:${OtlpDefaults.port}`)
    )
  }),
  Config.nested("OTEL")
)

type OtlpLayerParameters = {
  serviceName: string
  serviceVersion: string
}

export const layer = ({
  serviceName,
  serviceVersion
}: OtlpLayerParameters): Layer.Layer<never> =>
  pipe(
    Layer.unwrap(
      Effect.gen(function*() {
        const { baseUrl } = yield* OtelConfig

        /*
         * Implicitly extracts `OTEL_RESOURCE_ATTRIBUTES` if it is defined in the environment.
         *
         * `loggerMergeWithExisting: false` replaces the default console and span-event loggers, so logs are only
         * exported as OTLP log records.
         */
        return Otlp.layerJson({
          baseUrl,
          resource: {
            serviceName,
            serviceVersion,
            attributes: {
              "service.namespace": "one-kilo"
            }
          },
          loggerMergeWithExisting: false
        })
      })
    ),
    Layer.provide(NodeHttpClient.layerUndici),
    Layer.orDie
  )
