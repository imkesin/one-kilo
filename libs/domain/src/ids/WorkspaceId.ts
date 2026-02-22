import * as UUIDGenerator from "@one-kilo/lib/uuid/UUIDGenerator"
import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makeIdFromPrefixed } from "./internal/makeIdFromPrefixed.js"

export const WorkspaceId = pipe(
  UUIDv7.UUIDv7,
  S.brand("@one-kilo/domain/WorkspaceId"),
  S.annotations({
    description: "The unique identifier for a workspace.",
    identifier: "WorkspaceId",
    title: "Workspace ID"
  })
)
export type WorkspaceId = typeof WorkspaceId.Type

export class WorkspaceIdGenerator extends Effect.Service<WorkspaceIdGenerator>()(
  "@one-kilo/domain/WorkspaceIdGenerator",
  {
    dependencies: [UUIDGenerator.UUIDGenerator.Default],
    effect: Effect.gen(function*() {
      const uuidGenerator = yield* UUIDGenerator.UUIDGenerator
      const generate = Effect.map(uuidGenerator.v7, WorkspaceId.make)
      return { generate }
    })
  }
) {}

export const PrefixedWorkspaceId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith("w_"),
  S.brand("@one-kilo/domain/PrefixedWorkspaceId"),
  S.annotations({
    description: "The unique identifier for a workspace.",
    identifier: "PrefixedWorkspaceId",
    title: "Workspace ID (Prefixed)"
  })
)
export type PrefixedWorkspaceId = typeof PrefixedWorkspaceId.Type

export const WorkspaceIdFromPrefixed = makeIdFromPrefixed(PrefixedWorkspaceId, WorkspaceId, {
  prefix: "w_",
  makeId: WorkspaceId.make,
  makePrefixed: PrefixedWorkspaceId.make
})
