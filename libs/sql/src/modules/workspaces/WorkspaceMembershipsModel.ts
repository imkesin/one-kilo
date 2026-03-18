import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
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

  workosOrganizationMembershipId: WorkOSIds.OrganizationMembershipId,

  ...ModelAuditFields
}) {
  static asJsonBBuildObject({ alias } = { alias: "wsm" }) {
    return `
      JSONB_BUILD_OBJECT(
        'id', ${alias}.id,
        'user_id', ${alias}.user_id,
        'workspace_id', ${alias}.workspace_id,
        'role', ${alias}.role,
        'workos_organization_membership_id', ${alias}.workos_organization_membership_id,
        'created_at', ${alias}.created_at,
        'updated_at', ${alias}.updated_at,
        'archived_at', ${alias}.archived_at
      )
    `
  }
}
