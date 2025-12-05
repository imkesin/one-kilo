import { HttpApi, HttpApiError } from "@effect/platform"

export class WebApi extends HttpApi.make("WebApi")
  .prefix("/api")
  .addError(HttpApiError.InternalServerError)
{}
