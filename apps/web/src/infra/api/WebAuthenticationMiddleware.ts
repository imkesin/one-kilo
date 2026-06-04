import * as HttpApiMiddleware from "@effect/platform/HttpApiMiddleware"
import { WebActor } from "./WebActor"
import { WebUnauthenticatedError } from "./WebApiErrors"

export class WebAuthenticationMiddleware extends HttpApiMiddleware.Tag<WebAuthenticationMiddleware>()(
  "@one-kilo/web/WebAuthenticationMiddleware",
  {
    provides: WebActor,
    failure: WebUnauthenticatedError
  }
) {}
