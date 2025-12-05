import * as S from "effect/Schema"

export class ResourceNotFoundError
  extends S.TaggedError<ResourceNotFoundError>("@effect-workos/workos/ResourceNotFoundError")(
    "ResourceNotFoundError",
    {}
  )
{}

export class UnauthorizedError extends S.TaggedError<UnauthorizedError>("@effect-workos/workos/UnauthorizedError")(
  "UnauthorizedError",
  {}
) {}
