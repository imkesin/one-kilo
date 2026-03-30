import * as HttpApiEndpoint from "@effect/platform/HttpApiEndpoint"
import * as HttpApiGroup from "@effect/platform/HttpApiGroup"
import { UsersApi_MeSchemas } from "./UsersApiSchemas.ts"

export class UsersApi extends HttpApiGroup.make("users")
  .add(
    HttpApiEndpoint.get("me", "/me")
      .addSuccess(UsersApi_MeSchemas.Success)
  )
  .prefix("/users")
{}
