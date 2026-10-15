import * as HttpApiMiddleware from "effect/http-api/HttpApiMiddleware"
import type { WebActor } from "./WebActor.ts"
import { WebUnauthenticatedError } from "./WebApiErrors.ts"

export class WebAuthenticationMiddleware extends HttpApiMiddleware.Service<WebAuthenticationMiddleware, {
  provides: WebActor
}>()(
  "@one-kilo/web/WebAuthenticationMiddleware",
  {
    error: WebUnauthenticatedError
  }
) {}
