import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makeIdFromPrefixed } from "./internal/makeIdFromPrefixed.js"

export const WorkspaceMembershipId = pipe(
  UUIDv7.UUIDv7,
  S.brand("@one-kilo/domain/WorkspaceMembershipId"),
  S.annotations({
    description: "The unique identifier for a workspace membership",
    identifier: "WorkspaceMembershipId",
    title: "Workspace Membership ID"
  })
)
export type WorkspaceMembershipId = typeof WorkspaceMembershipId.Type

const WORKSPACE_MEMBERSHIP_PREFIX = "wsm_"

export const PrefixedWorkspaceMembershipId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith(WORKSPACE_MEMBERSHIP_PREFIX),
  S.brand("@one-kilo/domain/PrefixedWorkspaceMembershipId"),
  S.annotations({
    description: "The unique identifier for a workspace membership",
    identifier: "PrefixedWorkspaceMembershipId",
    title: "Workspace Membership ID (Prefixed)"
  })
)
export type PrefixedWorkspaceMembershipId = typeof PrefixedWorkspaceMembershipId.Type

export const WorkspaceMembershipIdFromPrefixed = makeIdFromPrefixed(
  PrefixedWorkspaceMembershipId,
  WorkspaceMembershipId,
  {
    prefix: WORKSPACE_MEMBERSHIP_PREFIX,
    makeId: WorkspaceMembershipId.make,
    makePrefixed: PrefixedWorkspaceMembershipId.make
  }
)
