import * as HttpApi from "@effect/platform/HttpApi"
import * as HttpApiError from "@effect/platform/HttpApiError"
import { UsersWebApi } from "~/modules/users/api/UsersWebApi"
import { WebAuthenticationMiddleware } from "./WebAuthenticationMiddleware"

export class WebApi extends HttpApi.make("WebApi")
  .add(UsersWebApi)
  .prefix("/api")
  .middleware(WebAuthenticationMiddleware)
  .addError(HttpApiError.InternalServerError)
{}
