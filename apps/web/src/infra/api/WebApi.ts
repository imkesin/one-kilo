import * as HttpApi from "@effect/platform/HttpApi"
import * as HttpApiError from "@effect/platform/HttpApiError"
import { WhoAmIWebApi } from "~/modules/whoami/api/WhoAmIWebApi"
import { WebAuthenticationMiddleware } from "./WebAuthenticationMiddleware"

export class WebApi extends HttpApi.make("WebApi")
  .add(WhoAmIWebApi)
  .prefix("/api")
  .middleware(WebAuthenticationMiddleware)
  .addError(HttpApiError.InternalServerError)
{}
