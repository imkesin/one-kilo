import * as HttpApi from "@effect/platform/HttpApi"
import * as HttpApiError from "@effect/platform/HttpApiError"
import { AccountsWebApi } from "~/modules/accounts/api/AccountsWebApi"
import { WebAuthenticationMiddleware } from "./WebAuthenticationMiddleware"

export class WebApi extends HttpApi.make("WebApi")
  .add(AccountsWebApi)
  .prefix("/api")
  .middleware(WebAuthenticationMiddleware)
  .addError(HttpApiError.InternalServerError)
{}
