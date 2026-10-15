import { WorkflowSuspensionId } from "@one-kilo/domain/ids/WorkflowSuspensionId"
import * as S from "effect/Schema"
import * as Model from "effect/schema/Model"
import * as ModelExtensions from "../../utils/ModelExtensions.ts"

export class WorkflowSuspensionsModel extends Model.Class<WorkflowSuspensionsModel>(
  "WorkflowSuspensionsModel"
)({
  id: Model.GeneratedByApp(WorkflowSuspensionId),

  executionId: S.Trimmed.check(S.isNonEmpty()),
  workflowName: S.Trimmed.check(S.isNonEmpty()),

  occurredAt: Model.DateTimeInsert,
  resumedAt: ModelExtensions.DateTimeNullable,
  dismissedAt: ModelExtensions.DateTimeNullable
}) {}
