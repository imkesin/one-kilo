import * as S from "effect/Schema"

export class PermissionsError extends S.TaggedError<PermissionsError>("@one-kilo/lib/PermissionsError")(
  "PermissionsError",
  {
    message: S.optional(S.Trimmed.check(S.isNonEmpty()))
  },
  {
    description: "Insufficient permissions to access resource or perform the requested action."
  }
) {}
