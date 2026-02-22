import * as Model from "@effect/sql/Model"
import { UserId } from "@one-kilo/domain/ids/UserId"
import { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import { WorkspaceMembershipId } from "@one-kilo/domain/ids/WorkspaceMembershipId"
import { ModelAuditFields } from "../../utils/ModelFields.ts"

export class WorkspaceMembershipsModel extends Model.Class<WorkspaceMembershipsModel>("WorkspaceMembershipsModel")({
  id: Model.GeneratedByApp(WorkspaceMembershipId),

  userId: UserId,
  workspaceId: WorkspaceId,

  ...ModelAuditFields
}) {}
