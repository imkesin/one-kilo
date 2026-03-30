import * as HttpApi from "@effect/platform/HttpApi"
import * as HttpApiError from "@effect/platform/HttpApiError"
import { ApplicationApi_AuthenticationMiddleware } from "./infra/AuthenticationMiddleware.ts"
import { AuthenticationApi as AuthenticationApiGroup } from "./modules/authentication/AuthenticationApi.ts"
import { HealthApi } from "./modules/health/HealthApi.ts"
import { UsersApi } from "./modules/users/UsersApi.ts"

export const ApplicationApi = HttpApi.make("@one-kilo/ApplicationApi")
  .add(UsersApi)
  .middleware(ApplicationApi_AuthenticationMiddleware)
  .addError(HttpApiError.InternalServerError)

export const AuthenticationApi = HttpApi.make("@one-kilo/AuthenticationApi")
  .add(AuthenticationApiGroup)
  .addError(HttpApiError.InternalServerError)

export const PublicApi = HttpApi.make("@one-kilo/PublicApi")
  .add(HealthApi)

export const ServerApi = HttpApi.make("@one-kilo/ServerApi")
  .addHttpApi(ApplicationApi)
  .addHttpApi(AuthenticationApi)
  .addHttpApi(PublicApi)
