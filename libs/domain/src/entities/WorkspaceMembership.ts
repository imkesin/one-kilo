import * as S from "effect/Schema"
import { UserId } from "../ids/UserId.ts"
import { WorkspaceId } from "../ids/WorkspaceId.ts"
import { WorkspaceMembershipId } from "../ids/WorkspaceMembershipId.ts"

export class WorkspaceMembership extends S.TaggedClass<WorkspaceMembership>("@one-kilo/domain/WorkspaceMembership")(
  "WorkspaceMembership",
  {
    id: WorkspaceMembershipId,

    userId: UserId,
    workspaceId: WorkspaceId
  },
  {
    identifier: "WorkspaceMembership",
    title: "Workspace Membership",
    description: "An association between a user and a workspace."
  }
) {}
