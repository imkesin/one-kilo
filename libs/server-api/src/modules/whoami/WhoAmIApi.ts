import * as HttpApiEndpoint from "@effect/platform/HttpApiEndpoint"
import * as HttpApiGroup from "@effect/platform/HttpApiGroup"
import { AuthenticationHeaders } from "../../infra/AuthenticationSecurity.ts"
import { WhoAmIApiSchemas } from "./WhoAmIApiSchemas.ts"

/*
 * `topLevel` hoists the endpoint onto the client root, so callers write `client.whoami()` rather
 * than `client.whoami.whoami()`.
 */
export class WhoAmIApi extends HttpApiGroup.make("whoami", { topLevel: true })
  .add(
    HttpApiEndpoint.get("whoami", "/whoami")
      .setHeaders(AuthenticationHeaders)
      .addSuccess(WhoAmIApiSchemas.Success)
  )
{}
