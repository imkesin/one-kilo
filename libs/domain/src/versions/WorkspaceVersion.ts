import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { AggregateVersion } from "./internal/AggregateVersion.ts"

export const WorkspaceVersion = pipe(
  AggregateVersion,
  S.brand("@one-kilo/domain/WorkspaceVersion"),
  S.annotate({
    description: "The version of a workspace, incremented with every committed change.",
    identifier: "WorkspaceVersion",
    title: "Workspace Version"
  })
)
export type WorkspaceVersion = typeof WorkspaceVersion.Type
