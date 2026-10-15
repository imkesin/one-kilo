import * as HttpApiEndpoint from "effect/http-api/HttpApiEndpoint"
import * as HttpApiGroup from "effect/http-api/HttpApiGroup"
import { AuthenticationHeaders } from "../../infra/AuthenticationSecurity.ts"
import { AthletesApi_RegisterSchemas } from "./AthletesApiSchemas.ts"

export class AthletesApi extends HttpApiGroup.make("athletes")
  .add(
    HttpApiEndpoint.post("register", "/", {
      headers: AuthenticationHeaders,
      payload: AthletesApi_RegisterSchemas.Payload,
      success: [
        AthletesApi_RegisterSchemas.Registered,
        AthletesApi_RegisterSchemas.AlreadyRegistered
      ],
      error: [
        AthletesApi_RegisterSchemas.Error.PersonNotFound,
        AthletesApi_RegisterSchemas.Error.Forbidden
      ]
    })
  )
  .prefix("/athletes")
{}
