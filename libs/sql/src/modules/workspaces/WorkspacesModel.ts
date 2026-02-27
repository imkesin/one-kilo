import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as Model from "@effect/sql/Model"
import { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import { WorkspaceName, WorkspaceType } from "@one-kilo/domain/values/WorkspaceValues"
import { ModelAuditFields } from "../../utils/ModelFields.ts"

export class WorkspacesModel extends Model.Class<WorkspacesModel>("@one-kilo/sql/WorkspacesModel")({
  id: Model.GeneratedByApp(WorkspaceId),

  name: WorkspaceName,
  type: WorkspaceType,

  workosOrganizationId: WorkOSIds.OrganizationId,

  ...ModelAuditFields
}) {}
