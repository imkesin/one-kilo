import * as Model from "@effect/sql/Model"
import { AuditLogId } from "@one-kilo/domain/ids/AuditLogId"
import { UserId } from "@one-kilo/domain/ids/UserId"
import { UUIDv7 } from "@one-kilo/lib/uuid/UUIDv7"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as ModelExtensions from "../../utils/ModelExtensions.ts"

export class AuditLogsModel extends Model.Class<AuditLogsModel>(
  "AuditLogsModel"
)({
  id: Model.GeneratedByApp(AuditLogId),

  performedByUserId: UserId,
  /*
   * The context is intentionally marked as unknown at the model-level.
   */
  context: S.Unknown,
  targets: pipe(
    S.NonEmptyArray(
      S.Struct({
        id: UUIDv7,
        type: S.NonEmptyTrimmedString
      })
    ),
    ModelExtensions.JsonFromStringOnWrite
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
