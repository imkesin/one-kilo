import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { Model } from "@effect/sql"
import { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import { Schema } from "effect"
import { ModelAuditFields } from "../../utils/ModelFields.ts"

export class OrganizationsModel extends Model.Class<OrganizationsModel>("OrganizationsModel")({
  id: Model.GeneratedByApp(WorkspaceId),

  name: Schema.NonEmptyTrimmedString,
  workosOrganizationId: WorkOSIds.OrganizationId,

  ...ModelAuditFields
}) {}
