import * as S from "effect/Schema"
import { WorkspaceId } from "../ids/WorkspaceId.ts"
import * as WorkOSIds from "@effect-workos/workos/domain/Ids"

export class Workspace extends S.TaggedClass<Workspace>("@effect-workos/domain/Workspace")(
  "Workspace",
  {
    id: WorkspaceId,
    name: S.NonEmptyTrimmedString,

    workosOrganizationId: WorkOSIds.OrganizationId
  },
  {
    identifier: "Workspace",
    title: "Workspace",
    description: "A container for shared work — the root of all access and visibility."
  }
) {}

