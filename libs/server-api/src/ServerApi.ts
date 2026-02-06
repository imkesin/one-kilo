import { HttpApi, HttpApiError } from "@effect/platform"
import { Authentication } from "./infra/Authentication/Authentication.ts"
import { PublicRateLimiting } from "./infra/RateLimiting/RateLimiting.ts"
import { HealthApi } from "./modules/Health/HealthApi.ts"
import { SessionsApi } from "./modules/Sessions/SessionsApi.ts"

const ApplicationApi = HttpApi.make("ApplicationApi")
  .middleware(Authentication)

const AuthenticationApi = HttpApi.make("AuthenticationApi")
  .add(SessionsApi)
  .prefix("/authentication")

const PublicApi = HttpApi.make("PublicApi")
  .add(HealthApi)
  .addHttpApi(AuthenticationApi)
  .middleware(PublicRateLimiting)

export const ServerApi = HttpApi.make("ServerApi")
  .addHttpApi(ApplicationApi)
  .addHttpApi(PublicApi)
  .addError(HttpApiError.InternalServerError)
