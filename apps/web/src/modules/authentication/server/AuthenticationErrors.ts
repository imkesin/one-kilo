import * as S from "effect/Schema"

export class AuthenticationContextCookieNotFoundError extends S.TaggedError<AuthenticationContextCookieNotFoundError>(
  "@one-kilo/web/AuthenticationContextCookieNotFoundError"
)(
  "AuthenticationContextCookieNotFoundError",
  {},
  {
    description: "The authentication context cookie was not found"
  }
) {}

export class AuthenticationContextExpiredError extends S.TaggedError<AuthenticationContextExpiredError>(
  "@one-kilo/web/AuthenticationContextExpiredError"
)(
  "AuthenticationContextExpiredError",
  {},
  {
    description: "The authentication context cookie is expired"
  }
) {}
