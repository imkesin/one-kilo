import * as Model from "@effect/sql/Model"
import { ActivityLogId } from "@one-kilo/domain/ids/ActivityLogId"
import { UserId } from "@one-kilo/domain/ids/UserId"
import { UUIDv7 } from "@one-kilo/lib/uuid/UUIDv7"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"

export class ActivityLogsModel extends Model.Class<ActivityLogsModel>(
  "ActivityLogsModel"
)({
  id: Model.GeneratedByApp(ActivityLogId),

  performedByUserId: UserId,
  /*
   * The context is intentionally marked as unknown at the model-level.
   */
  context: S.Unknown,
  targets: S.NonEmptyArray(
    S.Struct({
      id: UUIDv7,
      type: S.NonEmptyTrimmedString
    })
  ),
  timestamp: Model.DateTimeInsert,
  traceId: S.NonEmptyTrimmedString,
  type: S.NonEmptyTrimmedString,
  version: pipe(
    S.Number,
    S.int(),
    S.clamp(1, 3)
  )
}) {}
