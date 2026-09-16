import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as S from "effect/Schema"
import { AccountId } from "../ids/AccountId.ts"
import { WorkspaceId } from "../ids/WorkspaceId.ts"
import { WorkspaceMembershipId } from "../ids/WorkspaceMembershipId.ts"
import { WorkspaceMembershipRole } from "../values/WorkspaceMembershipValues.ts"
import { EntityRelationAuditFields } from "./internal/EntityFields.ts"

const EntityBaseFields = {
  id: WorkspaceMembershipId,

  accountId: AccountId,
  workspaceId: WorkspaceId,

  role: WorkspaceMembershipRole,

  workosOrganizationMembershipId: WorkOSIds.OrganizationMembershipId,

  ...EntityRelationAuditFields
} as const

export class WorkspaceMembership extends S.TaggedClass<WorkspaceMembership>("@one-kilo/domain/WorkspaceMembership")(
  "WorkspaceMembership",
  {
    ...EntityBaseFields
  },
  {
    identifier: "WorkspaceMembership",
    title: "Workspace Membership",
    description: "An association between an account and a workspace"
  }
) {}
