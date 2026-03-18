import * as HttpApiEndpoint from "@effect/platform/HttpApiEndpoint"
import * as HttpApiError from "@effect/platform/HttpApiError"
import * as HttpApiGroup from "@effect/platform/HttpApiGroup"
import { HealthApi_RetrieveLivenessSchemas } from "./HealthApiSchemas.ts"

export class HealthApi extends HttpApiGroup.make("health")
  .add(
    HttpApiEndpoint.get("retrieveLiveness", "/livez")
      .addSuccess(HealthApi_RetrieveLivenessSchemas.Success)
      .addError(HttpApiError.ServiceUnavailable)
  )
{}
