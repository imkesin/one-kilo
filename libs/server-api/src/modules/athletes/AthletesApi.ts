import * as HttpApiEndpoint from "@effect/platform/HttpApiEndpoint"
import * as HttpApiGroup from "@effect/platform/HttpApiGroup"
import { AuthenticationHeaders } from "../../infra/AuthenticationSecurity.ts"
import { AthletesApi_RegisterSchemas } from "./AthletesApiSchemas.ts"

export class AthletesApi extends HttpApiGroup.make("athletes")
  .add(
    HttpApiEndpoint.post("register", "/")
      .setHeaders(AuthenticationHeaders)
      .setPayload(AthletesApi_RegisterSchemas.Payload)
      .addSuccess(AthletesApi_RegisterSchemas.Registered)
      .addSuccess(AthletesApi_RegisterSchemas.AlreadyRegistered)
      .addError(AthletesApi_RegisterSchemas.Error.PersonNotFound)
      .addError(AthletesApi_RegisterSchemas.Error.Forbidden)
  )
  .prefix("/athletes")
{}
