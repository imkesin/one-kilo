import * as HttpApiEndpoint from "@effect/platform/HttpApiEndpoint"
import * as HttpApiGroup from "@effect/platform/HttpApiGroup"
import { AccountsApi_MeSchemas } from "@one-kilo/server-api/modules/accounts/AccountsApiSchemas"

export class AccountsWebApi extends HttpApiGroup.make("accounts")
  .add(
    HttpApiEndpoint.get("me", "/me")
      .addSuccess(AccountsApi_MeSchemas.Success)
  )
  .prefix("/accounts")
{}
