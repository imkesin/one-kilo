import * as S from "effect/Schema"

export class Authentication_ContextCookieNotFoundError extends S.TaggedError<Authentication_ContextCookieNotFoundError>(
  "@one-kilo/web/Authentication:ContextCookieNotFoundError"
)(
  "Authentication:ContextCookieNotFoundError",
  {},
  {
    description: "The authentication context cookie was not found"
  }
) {}

export class Authentication_ContextExpiredError extends S.TaggedError<Authentication_ContextExpiredError>(
  "@one-kilo/web/Authentication:ContextExpiredError"
)(
  "Authentication:ContextExpiredError",
  {},
  {
    description: "The authentication context cookie is expired"
  }
) {}
