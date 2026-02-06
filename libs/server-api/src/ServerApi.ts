import { HttpApi, HttpApiError } from "@effect/platform"
import { Authentication } from "./infra/Authentication.ts"
import { HealthApi } from "./modules/health/HealthApi.ts"
import { SessionsApi } from "./modules/sessions/SessionsApi.ts"

const ApplicationApi = HttpApi.make("ApplicationApi")
  .middleware(Authentication)

const AuthenticationApi = HttpApi.make("AuthenticationApi")
  .add(SessionsApi)
  .prefix("/authentication")

const PublicApi = HttpApi.make("PublicApi")
  .add(HealthApi)

export const ServerApi = HttpApi.make("ServerApi")
  .addHttpApi(ApplicationApi)
  .addHttpApi(AuthenticationApi)
  .addHttpApi(PublicApi)
  .addError(HttpApiError.InternalServerError)
