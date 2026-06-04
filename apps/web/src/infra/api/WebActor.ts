import type { AccessToken } from "@effect/auth-workos/domain/Values"
import * as Context from "effect/Context"

export class WebActor extends Context.Tag("@one-kilo/web/WebActor")<
  WebActor,
  { readonly workosAccessToken: AccessToken }
>() {}
