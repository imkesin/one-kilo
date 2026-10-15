import { HealthApi_RetrieveLivenessSchemas } from "@one-kilo/server-api/modules/health/HealthApiSchemas"
import { ServerApi } from "@one-kilo/server-api/ServerApi"
import * as Effect from "effect/Effect"
import * as HttpApiBuilder from "effect/http-api/HttpApiBuilder"

export const HealthHttp = HttpApiBuilder.group(
  ServerApi,
  "health",
  (handlers) =>
    handlers.handle(
      "retrieveLiveness",
      () => Effect.succeed(HealthApi_RetrieveLivenessSchemas.Success.make())
    )
)
