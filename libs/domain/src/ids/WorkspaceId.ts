import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makeIdFromPrefixed } from "./internal/makeIdFromPrefixed.js"

export const WorkspaceId = pipe(
  UUIDv7.UUIDv7,
  S.brand("@one-kilo/domain/WorkspaceId"),
  S.annotations({
    description: "The unique identifier for a workspace",
    identifier: "WorkspaceId",
    title: "Workspace ID"
  })
)
export type WorkspaceId = typeof WorkspaceId.Type

const WORKSPACE_PREFIX = "ws_"

export const PrefixedWorkspaceId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith(WORKSPACE_PREFIX),
  S.brand("@one-kilo/domain/PrefixedWorkspaceId"),
  S.annotations({
    description: "The unique identifier for a workspace",
    identifier: "PrefixedWorkspaceId",
    title: "Workspace ID (Prefixed)"
  })
)
export type PrefixedWorkspaceId = typeof PrefixedWorkspaceId.Type

export const WorkspaceIdFromPrefixed = makeIdFromPrefixed(PrefixedWorkspaceId, WorkspaceId, {
  prefix: WORKSPACE_PREFIX,
  makeId: WorkspaceId.make,
  makePrefixed: PrefixedWorkspaceId.make
})
