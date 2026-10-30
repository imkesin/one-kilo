import { AccountId } from "@one-kilo/domain/ids/AccountId"
import { AuditLogId } from "@one-kilo/domain/ids/AuditLogId"
import { UUIDv7 } from "@one-kilo/lib/uuid/UUIDv7"
import { identity, pipe } from "effect/Function"
import * as Number from "effect/Number"
import * as S from "effect/Schema"
import * as Model from "effect/schema/Model"
import * as SchemaTransformation from "effect/SchemaTransformation"
import * as ModelExtensions from "../../utils/ModelExtensions.ts"

export class AuditLogsModel extends Model.Class<AuditLogsModel>(
  "AuditLogsModel"
)({
  id: Model.GeneratedByApp(AuditLogId),

  performedByAccountId: AccountId,
  /*
   * The context is intentionally marked as unknown at the model-level.
   */
  context: S.Unknown,
  targets: pipe(
    S.NonEmptyArray(
      S.Struct({
        id: UUIDv7,
        type: S.Trimmed.check(S.isNonEmpty()),
        version: S.Int.check(S.isGreaterThanOrEqualTo(1))
      })
    ),
    ModelExtensions.JsonFromStringOnWrite
  ),
  timestamp: Model.DateTimeInsert,
  traceId: S.Trimmed.check(S.isNonEmpty()),
  type: S.Trimmed.check(S.isNonEmpty()),
  schemaVersion: pipe(
    S.Int,
    S.decode(
      SchemaTransformation.transform({
        decode: Number.clamp({ minimum: 1, maximum: 3 }),
        encode: identity
      })
    ),
    S.check(S.isBetween({ minimum: 1, maximum: 3 }))
  )
}) {}
