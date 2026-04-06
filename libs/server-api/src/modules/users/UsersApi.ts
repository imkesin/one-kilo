import * as HttpApiEndpoint from "@effect/platform/HttpApiEndpoint"
import * as HttpApiGroup from "@effect/platform/HttpApiGroup"
import { AuthenticationHeaders } from "../../infra/AuthenticationSecurity.ts"
import { UsersApi_MeSchemas } from "./UsersApiSchemas.ts"

export class UsersApi extends HttpApiGroup.make("users")
  .add(
    HttpApiEndpoint.get("me", "/me")
      .setHeaders(AuthenticationHeaders)
      .addSuccess(UsersApi_MeSchemas.Success)
  )
  .prefix("/users")
{}
