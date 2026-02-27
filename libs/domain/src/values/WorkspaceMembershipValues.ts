import { pipe } from "effect/Function"
import * as S from "effect/Schema"

export const WorkspaceMembershipRole = pipe(
  S.Literal("OWNER"),
  S.annotations({
    description: "The role of a user as a member of a workspace",
    identifier: "WorkspaceMembershipRole",
    title: "Workspace Membership Role"
  })
)
export type WorkspaceMembershipRole = typeof WorkspaceMembershipRole.Type
