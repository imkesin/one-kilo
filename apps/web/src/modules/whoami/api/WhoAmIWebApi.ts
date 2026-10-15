import { WhoAmIApiSchemas } from "@one-kilo/server-api/modules/whoami/WhoAmIApiSchemas"
import * as HttpApiEndpoint from "effect/http-api/HttpApiEndpoint"
import * as HttpApiGroup from "effect/http-api/HttpApiGroup"

export class WhoAmIWebApi extends HttpApiGroup.make("whoami", { topLevel: true })
  .add(
    HttpApiEndpoint.get("whoami", "/whoami", {
      success: WhoAmIApiSchemas.Success
    })
  )
{}
