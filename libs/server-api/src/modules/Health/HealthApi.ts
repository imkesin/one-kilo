import { HttpApiEndpoint, HttpApiError, HttpApiGroup } from "@effect/platform"
import { Health_RetrieveLiveness_ApiSchemas } from "./HealthApiSchemas.ts"

export class HealthApi extends HttpApiGroup.make("health")
  .add(
    HttpApiEndpoint.get("retrieveLiveness", "/livez")
      .addSuccess(Health_RetrieveLiveness_ApiSchemas.Success)
      .addError(HttpApiError.ServiceUnavailable)
  )
{}
