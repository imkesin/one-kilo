import * as S from "effect/Schema"

export const ApiAuditFields = {
  createdAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
  archivedAt: S.NullOr(S.DateTimeUtc)
} as const

export const ApiRelationAuditFields = {
  addedAt: S.DateTimeUtc,
  updatedAt: S.DateTimeUtc,
  removedAt: S.NullOr(S.DateTimeUtc)
} as const
