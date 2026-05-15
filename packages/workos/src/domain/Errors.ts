import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { AuthenticationCode, RefreshToken } from "./Values.ts"

const TypeId = "~effect/auth-workos/WorkOSError" as const

// === Common Errors ===

export class HttpRequestError extends S.TaggedError<HttpRequestError>(
  "@effect/auth-workos/HttpRequestError"
)(
  "HttpRequestError",
  {
    reason: S.Literal("Encode", "InvalidUrl", "Transport"),
    description: S.optional(S.String)
  }
) {
  get isTransient() {
    return this.reason === "Transport"
  }
}

export class HttpResponseError extends S.TaggedError<HttpResponseError>(
  "@effect/auth-workos/HttpResponseError"
)(
  "HttpResponseError",
  {
    reason: S.Literal("Decode", "EmptyBody", "StatusCode"),
    status: S.Int,
    description: S.optional(S.String)
  }
) {
  get isTransient() {
    return this.reason === "StatusCode"
      && (this.status === 429 || this.status >= 500)
  }
}

export class UnexpectedError extends S.TaggedError<UnexpectedError>("@effect/auth-workos/UnexpectedError")(
  "UnexpectedError",
  {
    cause: pipe(
      S.Defect,
      S.optional
    ),
    message: S.NonEmptyTrimmedString
  }
) {
  readonly isTransient = false
}

const WorkOSCommonErrorReason = S.Union(
  HttpRequestError,
  HttpResponseError,
  UnexpectedError
)

export class WorkOSCommonError extends S.TaggedError<WorkOSCommonError>("@effect/auth-workos/WorkOSCommonError")(
  "WorkOSCommonError",
  {
    reason: WorkOSCommonErrorReason
  }
) {
  readonly [TypeId] = TypeId

  get isTransient() {
    return this.reason.isTransient
  }
}

// === Specific Errors ===

export class InvalidAuthenticationCodeError
  extends S.TaggedError<InvalidAuthenticationCodeError>("@effect/auth-workos/InvalidAuthenticationCodeError")(
    "InvalidAuthenticationCodeError",
    {
      code: AuthenticationCode
    }
  )
{
  readonly [TypeId] = TypeId
}

export class InvalidRefreshTokenError
  extends S.TaggedError<InvalidRefreshTokenError>("@effect/auth-workos/InvalidRefreshTokenError")(
    "InvalidRefreshTokenError",
    {
      refreshToken: RefreshToken
    }
  )
{
  readonly [TypeId] = TypeId
}

export class ResourceNotFoundError
  extends S.TaggedError<ResourceNotFoundError>("@effect/auth-workos/ResourceNotFoundError")(
    "ResourceNotFoundError",
    {}
  )
{
  readonly [TypeId] = TypeId
}

export class UnauthorizedError extends S.TaggedError<UnauthorizedError>("@effect/auth-workos/UnauthorizedError")(
  "UnauthorizedError",
  {}
) {
  readonly [TypeId] = TypeId
}
