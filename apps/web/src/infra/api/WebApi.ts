import * as HttpApi from "@effect/platform/HttpApi"
import * as HttpApiError from "@effect/platform/HttpApiError"
import { UsersWebApi } from "~/modules/users/api/UsersWebApi"

export class WebApi extends HttpApi.make("WebApi")
  .add(UsersWebApi)
  .prefix("/api")
  .addError(HttpApiError.InternalServerError)
{}
