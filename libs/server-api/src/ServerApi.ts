import * as HttpApi from "effect/http-api/HttpApi"
import { AuthenticationMiddleware } from "./infra/AuthenticationSecurity.ts"
import { AthletesApi } from "./modules/athletes/AthletesApi.ts"
import { AuthenticationApi as AuthenticationApiGroup } from "./modules/authentication/AuthenticationApi.ts"
import { HealthApi } from "./modules/health/HealthApi.ts"
import { PersonsApi } from "./modules/persons/PersonsApi.ts"
import { WhoAmIApi } from "./modules/whoami/WhoAmIApi.ts"

export const ApplicationApi = HttpApi.make("@one-kilo/ApplicationApi")
  .add(AthletesApi)
  .add(PersonsApi)
  .add(WhoAmIApi)
  .middleware(AuthenticationMiddleware)

export const AuthenticationApi = HttpApi.make("@one-kilo/AuthenticationApi")
  .add(AuthenticationApiGroup)

export const PublicApi = HttpApi.make("@one-kilo/PublicApi")
  .add(HealthApi)

export const ServerApi = HttpApi.make("@one-kilo/ServerApi")
  .addHttpApi(ApplicationApi)
  .addHttpApi(AuthenticationApi)
  .addHttpApi(PublicApi)
