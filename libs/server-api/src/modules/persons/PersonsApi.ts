import * as HttpApiEndpoint from "@effect/platform/HttpApiEndpoint"
import * as HttpApiGroup from "@effect/platform/HttpApiGroup"
import { AuthenticationHeaders } from "../../infra/AuthenticationSecurity.ts"
import { PersonsApi_UpdateSchemas } from "./PersonsApiSchemas.ts"

export class PersonsApi extends HttpApiGroup.make("persons")
  .add(
    HttpApiEndpoint.patch("update", "/:personId")
      .setHeaders(AuthenticationHeaders)
      .setPath(PersonsApi_UpdateSchemas.Path)
      .setPayload(PersonsApi_UpdateSchemas.Payload)
      .addSuccess(PersonsApi_UpdateSchemas.Updated)
      .addError(PersonsApi_UpdateSchemas.Error.PersonNotFound)
      .addError(PersonsApi_UpdateSchemas.Error.Forbidden)
  )
  .prefix("/persons")
{}
