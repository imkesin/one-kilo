import * as S from "effect/Schema"

const TypeId = "~effect/auth-workos/WorkOSError" as const

export class InvalidUrlError extends S.TaggedError<InvalidUrlError>("@effect/auth-workos/InvalidUrlError")(
  "InvalidUrlError",
  {
    cause: S.Defect
  }
) {}

export class EncodingError extends S.TaggedError<EncodingError>("@effect/auth-workos/EncodingError")(
  "EncodingError",
  {
    cause: S.Defect
  }
) {}

const WorkOSErrorReason = S.Union(
  EncodingError,
  InvalidUrlError
)

export class WorkOSError extends S.TaggedError<WorkOSError>("@effect/auth-workos/WorkOSError")(
  "WorkOSError",
  {
    reason: WorkOSErrorReason
  }
) {
  readonly [TypeId] = TypeId
}
