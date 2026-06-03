import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import * as S from "effect/Schema"

/*
 * TODO: Consolidate into a single `WebUnauthenticatedError`
 */
export class Users_UnauthenticatedError extends S.TaggedError<Users_UnauthenticatedError>(
  "@one-kilo/web/Users:UnauthenticatedError"
)(
  "Users:UnauthenticatedError",
  {},
  HttpApiSchema.annotations({ status: 401 })
) {}
