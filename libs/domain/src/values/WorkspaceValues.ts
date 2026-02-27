import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as SimplifiedLatin from "./internal/SimplifiedLatin.ts"

export const WorkspaceName = pipe(
  SimplifiedLatin.Name,
  S.maxLength(64),
  S.brand("@one-kilo/domain/WorkspaceName"),
  S.annotations({
    description: "The name of a workspace.",
    identifier: "WorkspaceName",
    title: "Workspace Name"
  })
)
export type WorkspaceName = typeof WorkspaceName.Type

export const WorkspaceType = pipe(
  S.Literal("PERSONAL"),
  S.annotations({
    description: "The type of a workspace.",
    identifier: "WorkspaceType",
    title: "Workspace Type"
  })
)
export type WorkspaceType = typeof WorkspaceType.Type
