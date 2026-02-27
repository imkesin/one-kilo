import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as S from "effect/Schema"
import { WorkspaceId } from "../ids/WorkspaceId.ts"
import { WorkspaceName, WorkspaceType } from "../values/WorkspaceValues.ts"
import { EntityAuditFields } from "./internal/EntityFields.ts"

const EntityBaseFields = {
  id: WorkspaceId,

  name: WorkspaceName,
  type: WorkspaceType,

  workosOrganizationId: WorkOSIds.OrganizationId,

  ...EntityAuditFields
} as const

export class WorkspaceEntity extends S.TaggedClass<WorkspaceEntity>("@one-kilo/domain/WorkspaceEntity")(
  "WorkspaceEntity",
  { ...EntityBaseFields },
  {
    identifier: "WorkspaceEntity",
    title: "Workspace Entity",
    description: "A minimal workspace entity"
  }
) {}

export class Workspace extends S.TaggedClass<Workspace>("@one-kilo/domain/Workspace")(
  "Workspace",
  {
    ...EntityBaseFields
  },
  {
    identifier: "Workspace",
    title: "Workspace",
    description: "A container for shared work — the root of all access and visibility."
  }
) {}
