import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import { WorkspaceName, WorkspaceType } from "@one-kilo/domain/values/WorkspaceValues"
import { WorkspaceVersion } from "@one-kilo/domain/versions/WorkspaceVersion"
import * as Model from "effect/schema/Model"
import { ModelAuditFields } from "../../utils/ModelFields.ts"

export class WorkspacesModel extends Model.Class<WorkspacesModel>("@one-kilo/sql/WorkspacesModel")({
  id: Model.GeneratedByApp(WorkspaceId),
  version: Model.GeneratedByDb(WorkspaceVersion),

  name: WorkspaceName,
  type: WorkspaceType,

  workosOrganizationId: WorkOSIds.OrganizationId,

  ...ModelAuditFields
}) {}
