import * as S from "effect/Schema"
import { UserId } from "../ids/UserId.ts"
import { WorkspaceId } from "../ids/WorkspaceId.ts"

export class WorkspaceMembership extends S.TaggedClass<WorkspaceMembership>("@one-kilo/domain/WorkspaceMembership")(
  "WorkspaceMembership",
  {
    userId: UserId,
    workspaceId: WorkspaceId
  },
  {
    identifier: "WorkspaceMembership",
    title: "Workspace Membership",
    description: "An association between a user and a workspace."
  }
) {}
