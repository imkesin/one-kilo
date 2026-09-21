import * as HttpApiEndpoint from "@effect/platform/HttpApiEndpoint"
import * as HttpApiGroup from "@effect/platform/HttpApiGroup"
import { WhoAmIApiSchemas } from "@one-kilo/server-api/modules/whoami/WhoAmIApiSchemas"

export class WhoAmIWebApi extends HttpApiGroup.make("whoami", { topLevel: true })
  .add(
    HttpApiEndpoint.get("whoami", "/whoami")
      .addSuccess(WhoAmIApiSchemas.Success)
  )
{}
