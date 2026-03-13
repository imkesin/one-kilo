import * as S from "effect/Schema"

const TypeId = "~effect/auth-workos/WorkOSError" as const

export class HttpRequestError extends S.TaggedError<HttpRequestError>(
  "@effect/auth-workos/HttpRequestError"
)(
  "HttpRequestError",
  {
    cause: S.Defect
  }
) {}

export class HttpResponseError extends S.TaggedError<HttpResponseError>(
  "@effect/auth-workos/HttpResponseError"
)(
  "HttpResponseError",
  {
    cause: S.Defect
  }
) {}

export class ResourceNotFoundError
  extends S.TaggedError<ResourceNotFoundError>("@effect/auth-workos/ResourceNotFoundError")(
    "ResourceNotFoundError",
    {}
  )
{}

export class UnauthorizedError extends S.TaggedError<UnauthorizedError>("@effect/auth-workos/UnauthorizedError")(
  "UnauthorizedError",
  {}
) {}

export class UnexpectedError extends S.TaggedError<UnexpectedError>("@effect/auth-workos/UnexpectedError")(
  "UnexpectedError",
  {
    cause: S.Defect,
    message: S.NonEmptyTrimmedString
  }
) {}

const WorkOSErrorReason = S.Union(
  HttpRequestError,
  HttpResponseError,
  ResourceNotFoundError,
  UnauthorizedError,
  UnexpectedError
)

export class WorkOSError extends S.TaggedError<WorkOSError>("@effect/auth-workos/WorkOSError")(
  "WorkOSError",
  {
    reason: WorkOSErrorReason
  }
) {
  readonly [TypeId] = TypeId
}
