import { WorkspaceIdFromPrefixed } from "@one-kilo/domain/ids/WorkspaceId"
import { WorkspaceName, WorkspaceType } from "@one-kilo/domain/values/WorkspaceValues"
import * as S from "effect/Schema"
import { ApiAuditFields } from "../../internal/ApiFields.ts"

export const Api_Workspace = S.Struct({
  id: WorkspaceIdFromPrefixed,
  name: WorkspaceName,
  type: WorkspaceType,

  ...ApiAuditFields
})
export type Api_Workspace = typeof Api_Workspace.Type
