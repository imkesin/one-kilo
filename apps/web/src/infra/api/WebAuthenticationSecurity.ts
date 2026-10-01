import * as HttpApiMiddleware from "@effect/platform/HttpApiMiddleware"
import { WebActor } from "./WebActor.ts"
import { WebUnauthenticatedError } from "./WebApiErrors.ts"

export class WebAuthenticationMiddleware extends HttpApiMiddleware.Tag<WebAuthenticationMiddleware>()(
  "@one-kilo/web/WebAuthenticationMiddleware",
  {
    provides: WebActor,
    failure: WebUnauthenticatedError
  }
) {}
