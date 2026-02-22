import * as UUIDGenerator from "@one-kilo/lib/uuid/UUIDGenerator"
import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makeIdFromPrefixed } from "./internal/makeIdFromPrefixed.js"

export const WorkspaceMembershipId = pipe(
  UUIDv7.UUIDv7,
  S.brand("@one-kilo/domain/WorkspaceMembershipId"),
  S.annotations({
    description: "The unique identifier for a workspace membership.",
    identifier: "WorkspaceMembershipId",
    title: "Workspace Membership ID"
  })
)
export type WorkspaceMembershipId = typeof WorkspaceMembershipId.Type

export class WorkspaceMembershipIdGenerator extends Effect.Service<WorkspaceMembershipIdGenerator>()(
  "@one-kilo/domain/WorkspaceMembershipIdGenerator",
  {
    dependencies: [UUIDGenerator.UUIDGenerator.Default],
    effect: Effect.gen(function*() {
      const uuidGenerator = yield* UUIDGenerator.UUIDGenerator
      const generate = Effect.map(uuidGenerator.v7, WorkspaceMembershipId.make)
      return { generate }
    })
  }
) {}

export const PrefixedWorkspaceMembershipId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith("wm_"),
  S.brand("@one-kilo/domain/PrefixedWorkspaceMembershipId"),
  S.annotations({
    description: "The unique identifier for a workspace membership.",
    identifier: "PrefixedWorkspaceMembershipId",
    title: "Workspace Membership ID (Prefixed)"
  })
)
export type PrefixedWorkspaceMembershipId = typeof PrefixedWorkspaceMembershipId.Type

export const WorkspaceMembershipIdFromPrefixed = makeIdFromPrefixed(
  PrefixedWorkspaceMembershipId,
  WorkspaceMembershipId,
  {
    prefix: "wm_",
    makeId: WorkspaceMembershipId.make,
    makePrefixed: PrefixedWorkspaceMembershipId.make
  }
)
