import * as S from "effect/Schema"
import { UserId } from "../ids/UserId.ts"
import { WorkspaceId } from "../ids/WorkspaceId.ts"
import { WorkspaceMembershipId } from "../ids/WorkspaceMembershipId.ts"
import { WorkspaceMembershipRole } from "../values/WorkspaceMembershipValues.ts"

const EntityBaseFields = {
  id: WorkspaceMembershipId,

  userId: UserId,
  workspaceId: WorkspaceId,

  role: WorkspaceMembershipRole
} as const

export class WorkspaceMembership extends S.TaggedClass<WorkspaceMembership>("@one-kilo/domain/WorkspaceMembership")(
  "WorkspaceMembership",
  {
    ...EntityBaseFields
  },
  {
    identifier: "WorkspaceMembership",
    title: "Workspace Membership",
    description: "An association between a user and a workspace."
  }
) {}
