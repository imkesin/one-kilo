import * as Model from "@effect/sql/Model"
import { WorkflowSuspensionId } from "@one-kilo/domain/ids/WorkflowSuspensionId"
import * as S from "effect/Schema"
import * as ModelExtensions from "../../utils/ModelExtensions.ts"

export class WorkflowSuspensionsModel extends Model.Class<WorkflowSuspensionsModel>(
  "WorkflowSuspensionsModel"
)({
  id: Model.GeneratedByApp(WorkflowSuspensionId),

  executionId: S.NonEmptyTrimmedString,
  workflowName: S.NonEmptyTrimmedString,

  occurredAt: Model.DateTimeInsert,
  resumedAt: ModelExtensions.DateTimeNullable,
  dismissedAt: ModelExtensions.DateTimeNullable
}) {}
