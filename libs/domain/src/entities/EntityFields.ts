import * as S from "effect/Schema"

export const EntityAuditFields = {
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
  archivedAt: S.NullOr(S.DateTimeUtc)
} as const
