import * as Model from "@effect/sql/Model"
import { ActivityLogId } from "@one-kilo/domain/ids/ActivityLogId"
import { UserId } from "@one-kilo/domain/ids/UserId"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"

export class ActivityLogsModel extends Model.Class<ActivityLogsModel>(
  "ActivityLogsModel"
)({
  id: Model.Generated(ActivityLogId),

  actorId: UserId,
  context: S.Unknown,
  targets: S.Unknown,

  timestamp: S.DateTimeUtc,
  traceId: S.NonEmptyTrimmedString,
  version: pipe(
    S.Number,
    S.int(),
    S.clamp(1, 3)
  )
}) {}
