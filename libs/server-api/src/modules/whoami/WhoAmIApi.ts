import * as HttpApiEndpoint from "effect/http-api/HttpApiEndpoint"
import * as HttpApiGroup from "effect/http-api/HttpApiGroup"
import { AuthenticationHeaders } from "../../infra/AuthenticationSecurity.ts"
import { WhoAmIApiSchemas } from "./WhoAmIApiSchemas.ts"

/*
 * `topLevel` hoists the endpoint onto the client root, so callers write `client.whoami()` rather
 * than `client.whoami.whoami()`.
 */
export class WhoAmIApi extends HttpApiGroup.make("whoami", { topLevel: true })
  .add(
    HttpApiEndpoint.get("whoami", "/whoami", {
      headers: AuthenticationHeaders,
      success: WhoAmIApiSchemas.Success
    })
  )
{}
