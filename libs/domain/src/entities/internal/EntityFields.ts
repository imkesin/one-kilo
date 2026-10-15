import * as S from "effect/Schema"

export const EntityAuditFields = {
  createdAt: S.DateTimeUtcFromString,
  updatedAt: S.DateTimeUtcFromString,
  archivedAt: S.NullOr(S.DateTimeUtcFromString)
} as const

export const EntityRelationAuditFields = {
  addedAt: S.DateTimeUtcFromString,
  updatedAt: S.DateTimeUtcFromString,
  removedAt: S.NullOr(S.DateTimeUtcFromString)
} as const
