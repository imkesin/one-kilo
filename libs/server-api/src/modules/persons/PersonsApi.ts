import * as HttpApiEndpoint from "effect/http-api/HttpApiEndpoint"
import * as HttpApiGroup from "effect/http-api/HttpApiGroup"
import { AuthenticationHeaders } from "../../infra/AuthenticationSecurity.ts"
import { PersonsApi_UpdateSchemas } from "./PersonsApiSchemas.ts"

export class PersonsApi extends HttpApiGroup.make("persons")
  .add(
    HttpApiEndpoint.patch("update", "/:personId", {
      headers: AuthenticationHeaders,
      params: PersonsApi_UpdateSchemas.Path,
      payload: PersonsApi_UpdateSchemas.Payload,
      success: PersonsApi_UpdateSchemas.Updated,
      error: [
        PersonsApi_UpdateSchemas.Error.PersonNotFound,
        PersonsApi_UpdateSchemas.Error.Forbidden
      ]
    })
  )
  .prefix("/persons")
{}
