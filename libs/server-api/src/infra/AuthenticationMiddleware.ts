import * as HttpApiMiddleware from "@effect/platform/HttpApiMiddleware"
import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import * as HttpApiSecurity from "@effect/platform/HttpApiSecurity"
import { Actor } from "@one-kilo/domain/tags/Actor"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"

const UNAUTHENTICATED_ERROR_MESSAGE = "Authentication is required and has failed or has not been provided"

export class ApplicationApi_UnauthenticatedError extends S.TaggedError<ApplicationApi_UnauthenticatedError>(
  "@one-kilo/server-api/UnauthenticatedError"
)(
  "UnauthenticatedError",
  {
    message: pipe(
      S.NonEmptyTrimmedString,
      S.optional,
      S.withDefaults({
        constructor: () => UNAUTHENTICATED_ERROR_MESSAGE,
        decoding: () => UNAUTHENTICATED_ERROR_MESSAGE
      })
    )
  },
  HttpApiSchema.annotations({ status: 401 })
) {}

export class ApplicationApi_AuthenticationMiddleware
  extends HttpApiMiddleware.Tag<ApplicationApi_AuthenticationMiddleware>()(
    "@one-kilo/server-api/AuthenticationMiddleware",
    {
      failure: ApplicationApi_UnauthenticatedError,
      provides: Actor,
      security: {
        jwt: HttpApiSecurity.bearer
      }
    }
  )
{}
