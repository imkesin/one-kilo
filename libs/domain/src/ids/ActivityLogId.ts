import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makeIdFromPrefixed } from "./internal/makeIdFromPrefixed.js"

export const ActivityLogId = pipe(
  UUIDv7.UUIDv7,
  S.brand("@one-kilo/domain/ActivityLogId"),
  S.annotations({
    description: "The unique identifier for an activity log.",
    identifier: "ActivityLogId",
    title: "Activity Log ID"
  })
)
export type ActivityLogId = typeof ActivityLogId.Type

const ACTIVITY_LOG_PREFIX = "alog_"

export const PrefixedActivityLogId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith(ACTIVITY_LOG_PREFIX),
  S.brand("@one-kilo/domain/PrefixedActivityLogId"),
  S.annotations({
    description: "The unique identifier for an activity log.",
    identifier: "PrefixedActivityLogId",
    title: "Activity Log ID (Prefixed)"
  })
)
export type PrefixedActivityLogId = typeof PrefixedActivityLogId.Type

export const ActivityLogIdFromPrefixed = makeIdFromPrefixed(
  PrefixedActivityLogId,
  ActivityLogId,
  {
    prefix: ACTIVITY_LOG_PREFIX,
    makeId: ActivityLogId.make,
    makePrefixed: PrefixedActivityLogId.make
  }
)
