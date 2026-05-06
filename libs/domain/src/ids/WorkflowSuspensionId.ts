import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makeIdFromPrefixed } from "./internal/makeIdFromPrefixed.js"

export const WorkflowSuspensionId = pipe(
  UUIDv7.UUIDv7,
  S.brand("@one-kilo/domain/WorkflowSuspensionId"),
  S.annotations({
    description: "The unique identifier for a workflow suspension record.",
    identifier: "WorkflowSuspensionId",
    title: "Workflow Suspension ID"
  })
)
export type WorkflowSuspensionId = typeof WorkflowSuspensionId.Type

const WORKFLOW_SUSPENSION_PREFIX = "ws_"

export const PrefixedWorkflowSuspensionId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith(WORKFLOW_SUSPENSION_PREFIX),
  S.brand("@one-kilo/domain/PrefixedWorkflowSuspensionId"),
  S.annotations({
    description: "The unique identifier for a workflow suspension record.",
    identifier: "PrefixedWorkflowSuspensionId",
    title: "Workflow Suspension ID (Prefixed)"
  })
)
export type PrefixedWorkflowSuspensionId = typeof PrefixedWorkflowSuspensionId.Type

export const WorkflowSuspensionIdFromPrefixed = makeIdFromPrefixed(
  PrefixedWorkflowSuspensionId,
  WorkflowSuspensionId,
  {
    prefix: WORKFLOW_SUSPENSION_PREFIX,
    makeId: WorkflowSuspensionId.make,
    makePrefixed: PrefixedWorkflowSuspensionId.make
  }
)
