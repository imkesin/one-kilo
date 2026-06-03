import * as HttpApiEndpoint from "@effect/platform/HttpApiEndpoint"
import * as HttpApiGroup from "@effect/platform/HttpApiGroup"
import { UsersApi_MeSchemas } from "@one-kilo/server-api/modules/users/UsersApiSchemas"
import { Users_UnauthenticatedError } from "./UsersWebApiErrors"

export class UsersWebApi extends HttpApiGroup.make("users")
  .add(
    HttpApiEndpoint.get("me", "/me")
      .addSuccess(UsersApi_MeSchemas.Success)
      .addError(Users_UnauthenticatedError)
  )
  .prefix("/users")
{}
