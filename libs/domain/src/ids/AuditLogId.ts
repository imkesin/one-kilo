import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makeIdFromPrefixed } from "./internal/makeIdFromPrefixed.js"

export const AuditLogId = pipe(
  UUIDv7.UUIDv7,
  S.brand("@one-kilo/domain/AuditLogId"),
  S.annotations({
    description: "The unique identifier for an audit log.",
    identifier: "AuditLogId",
    title: "Audit Log ID"
  })
)
export type AuditLogId = typeof AuditLogId.Type

const AUDIT_LOG_PREFIX = "al_"

export const PrefixedAuditLogId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith(AUDIT_LOG_PREFIX),
  S.brand("@one-kilo/domain/PrefixedAuditLogId"),
  S.annotations({
    description: "The unique identifier for an audit log.",
    identifier: "PrefixedAuditLogId",
    title: "Audit Log ID (Prefixed)"
  })
)
export type PrefixedAuditLogId = typeof PrefixedAuditLogId.Type

export const AuditLogIdFromPrefixed = makeIdFromPrefixed(
  PrefixedAuditLogId,
  AuditLogId,
  {
    prefix: AUDIT_LOG_PREFIX,
    makeId: AuditLogId.make,
    makePrefixed: PrefixedAuditLogId.make
  }
)
