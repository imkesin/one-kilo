import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import { HealthApi_RetrieveLivenessSchemas } from "@one-kilo/server-api/modules/health/HealthApiSchemas"
import { ServerApi } from "@one-kilo/server-api/ServerApi"
import * as Effect from "effect/Effect"

export const HealthHttp = HttpApiBuilder.group(
  ServerApi,
  "health",
  (handlers) =>
    handlers.handle(
      "retrieveLiveness",
      () => Effect.succeed(HealthApi_RetrieveLivenessSchemas.Success.make())
    )
)
