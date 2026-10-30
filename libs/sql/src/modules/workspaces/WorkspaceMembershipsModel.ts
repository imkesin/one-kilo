import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { AccountId } from "@one-kilo/domain/ids/AccountId"
import { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import { WorkspaceMembershipId } from "@one-kilo/domain/ids/WorkspaceMembershipId"
import { WorkspaceMembershipRole } from "@one-kilo/domain/values/WorkspaceMembershipValues"
import { WorkspaceMembershipVersion } from "@one-kilo/domain/versions/WorkspaceMembershipVersion"
import * as Model from "effect/schema/Model"
import { ModelAuditFields } from "../../utils/ModelFields.ts"

export class WorkspaceMembershipsModel extends Model.Class<WorkspaceMembershipsModel>("WorkspaceMembershipsModel")({
  id: Model.GeneratedByApp(WorkspaceMembershipId),
  version: Model.GeneratedByDb(WorkspaceMembershipVersion),

  accountId: AccountId,
  workspaceId: WorkspaceId,

  role: WorkspaceMembershipRole,

  workosOrganizationMembershipId: WorkOSIds.OrganizationMembershipId,

  ...ModelAuditFields
}) {
  static asJsonBBuildObject({ alias = "workspace_memberships" } = {}) {
    return `
      JSONB_BUILD_OBJECT(
        'id', ${alias}.id,
        'version', ${alias}.version,
        'account_id', ${alias}.account_id,
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
