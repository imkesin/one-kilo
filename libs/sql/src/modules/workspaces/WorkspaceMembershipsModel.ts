import * as Model from "@effect/sql/Model"
import { UserId } from "@one-kilo/domain/ids/UserId"
import { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import { WorkspaceMembershipId } from "@one-kilo/domain/ids/WorkspaceMembershipId"
import { WorkspaceMembershipRole } from "@one-kilo/domain/values/WorkspaceMembershipValues"
import { ModelAuditFields } from "../../utils/ModelFields.ts"

export class WorkspaceMembershipsModel extends Model.Class<WorkspaceMembershipsModel>("WorkspaceMembershipsModel")({
  id: Model.GeneratedByApp(WorkspaceMembershipId),

  userId: UserId,
  workspaceId: WorkspaceId,

  role: WorkspaceMembershipRole,

  ...ModelAuditFields
}) {}
