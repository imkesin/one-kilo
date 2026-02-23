import { pipe } from "effect/Function"
import * as S from "effect/Schema"

export const WorkspaceType = pipe(
  S.Literal("PERSONAL"),
  S.annotations({
    description: "The type of a workspace.",
    identifier: "WorkspaceType",
    title: "Workspace Type"
  })
)
export type WorkspaceType = typeof WorkspaceType.Type
