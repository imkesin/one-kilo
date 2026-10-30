import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { AggregateVersion } from "./internal/AggregateVersion.ts"

export const WorkspaceMembershipVersion = pipe(
  AggregateVersion,
  S.brand("@one-kilo/domain/WorkspaceMembershipVersion"),
  S.annotate({
    description: "The version of a workspace membership, incremented with every committed change.",
    identifier: "WorkspaceMembershipVersion",
    title: "Workspace Membership Version"
  })
)
export type WorkspaceMembershipVersion = typeof WorkspaceMembershipVersion.Type
