import * as HttpApiEndpoint from "effect/http-api/HttpApiEndpoint"
import * as HttpApiError from "effect/http-api/HttpApiError"
import * as HttpApiGroup from "effect/http-api/HttpApiGroup"
import { HealthApi_RetrieveLivenessSchemas } from "./HealthApiSchemas.ts"

export class HealthApi extends HttpApiGroup.make("health")
  .add(
    HttpApiEndpoint.get("retrieveLiveness", "/livez", {
      success: HealthApi_RetrieveLivenessSchemas.Success,
      error: HttpApiError.ServiceUnavailable
    })
  )
{}
