import { pipe } from "effect/Function"
import * as S from "effect/Schema"

export const WorkspaceId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith("ws_"),
  S.brand("@effect-workos/domain/WorkspaceId"),
  S.annotations({
    description: "The unique identifier for a workspace.",
    identifier: "WorkspaceId",
    title: "Workspace ID",
  })
)
export type WorkspaceId = typeof WorkspaceId.Type

