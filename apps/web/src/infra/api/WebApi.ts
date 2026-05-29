import * as HttpApi from "@effect/platform/HttpApi"
import * as HttpApiError from "@effect/platform/HttpApiError"

export class WebApi extends HttpApi.make("WebApi")
  .prefix("/api")
  .addError(HttpApiError.InternalServerError)
{}
