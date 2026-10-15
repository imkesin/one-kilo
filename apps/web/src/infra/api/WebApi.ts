import * as HttpApi from "effect/http-api/HttpApi"
import { WhoAmIWebApi } from "~/modules/whoami/api/WhoAmIWebApi"
import { WebAuthenticationMiddleware } from "./WebAuthenticationSecurity"

export class WebApi extends HttpApi.make("WebApi")
  .add(WhoAmIWebApi)
  .prefix("/api")
  .middleware(WebAuthenticationMiddleware)
{}
