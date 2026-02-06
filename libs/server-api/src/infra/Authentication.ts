import { HttpApiMiddleware, HttpApiSchema, HttpApiSecurity } from "@effect/platform"
import { Actor } from "@one-kilo/domain/tags/Actor"
import { Schema } from "effect"

export class UnauthorizedApiError extends Schema.TaggedError<UnauthorizedApiError>()(
  "UnauthorizedApiError",
  {},
  HttpApiSchema.annotations({
    description: "Authentication is required and has failed or has not been provided",
    status: 401
  })
) {}

export class Authentication extends HttpApiMiddleware.Tag<Authentication>()(
  "Authentication",
  {
    failure: UnauthorizedApiError,
    provides: Actor,
    security: {
      jwt: HttpApiSecurity.bearer
    }
  }
) {}
