import type { AccessToken } from "@effect/auth-workos/domain/Values"
import * as Context from "effect/Context"

export class WebActor extends Context.Service<
  WebActor,
  { readonly workosAccessToken: AccessToken }
>()("@one-kilo/web/WebActor") {}
