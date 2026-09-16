import * as HttpApiEndpoint from "@effect/platform/HttpApiEndpoint"
import * as HttpApiGroup from "@effect/platform/HttpApiGroup"
import { AuthenticationHeaders } from "../../infra/AuthenticationSecurity.ts"
import { AccountsApi_MeSchemas } from "./AccountsApiSchemas.ts"

export class AccountsApi extends HttpApiGroup.make("accounts")
  .add(
    HttpApiEndpoint.get("me", "/me")
      .setHeaders(AuthenticationHeaders)
      .addSuccess(AccountsApi_MeSchemas.Success)
  )
  .prefix("/accounts")
{}
