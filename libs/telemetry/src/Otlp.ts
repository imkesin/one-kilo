import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Otlp from "effect/observability/Otlp"
import * as OtlpSerialization from "effect/observability/OtlpSerialization"

type OtlpLayerParameters = {
  serviceName: string
  serviceVersion: string
}

/*
 * Configured by the standard `OTEL_*` environment variables (including `OTEL_RESOURCE_ATTRIBUTES`). Each signal is
 * a no-op unless `OTEL_EXPORTER_OTLP_ENDPOINT` is set and `OTEL_{TRACES,METRICS,LOGS}_EXPORTER` includes `otlp`.
 *
 * `loggerMergeWithExisting: false` replaces the default console and span-event loggers, so logs are only
 * exported as OTLP log records.
 */
export const layer = ({
  serviceName,
  serviceVersion
}: OtlpLayerParameters): Layer.Layer<never> =>
  pipe(
    Otlp.layerFromConfig({
      resource: {
        serviceName,
        serviceVersion,
        attributes: {
          "service.namespace": "one-kilo"
        }
      },
      loggerMergeWithExisting: false
    }),
    Layer.provide(OtlpSerialization.layerProtobuf),
    Layer.provide(NodeHttpClient.layerUndici)
  )
