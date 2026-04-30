import { PersonUpdatedActivityLog } from "@one-kilo/domain/activity-logs/PersonActivityLogs"
import { UserCreatedActivityLog } from "@one-kilo/domain/activity-logs/UserActivityLogs"
import { WorkspaceCreatedActivityLog } from "@one-kilo/domain/activity-logs/WorkspaceActivityLogs"
import { WorkspaceMembershipCreatedActivityLog } from "@one-kilo/domain/activity-logs/WorkspaceMembershipActivityLogs"
import { dieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import type { ActivityLogsModel } from "../ActivityLogsModel.ts"

export const toActivityLog = ({
  id,
  performedByUserId,
  context,
  targets,
  timestamp,
  traceId,
  type,
  version
}: typeof ActivityLogsModel.select.Type) => {
  if (
    type === "User.Created"
    && version === 1
    && S.is(UserCreatedActivityLog.fields.targets)(targets)
  ) {
    return Effect.succeed(
      new UserCreatedActivityLog({
        id,
        performedByUserId,
        targets,
        timestamp,
        traceId,
        type: "User.Created",
        version: 1
      })
    )
  }

  if (
    type === "Person.Updated"
    && version === 1
    && S.is(PersonUpdatedActivityLog.fields.targets)(targets)
  ) {
    return pipe(
      PersonUpdatedActivityLog.decodeContextUnknown(context),
      Effect.map((decodedContext) =>
        new PersonUpdatedActivityLog({
          id,
          performedByUserId,
          context: decodedContext,
          targets,
          timestamp,
          traceId,
          type: "Person.Updated",
          version: 1
        })
      ),
      Effect.catchTag("ParseError", () =>
        pipe(
          dieWithUnexpectedError("Failed to decode `Person.Updated` activity log context"),
          Effect.annotateLogs({ activityLog: { id, type, version } })
        ))
    )
  }

  if (
    type === "Workspace.Created"
    && version === 1
    && S.is(WorkspaceCreatedActivityLog.fields.targets)(targets)
  ) {
    return Effect.succeed(
      new WorkspaceCreatedActivityLog({
        id,
        performedByUserId,
        targets,
        timestamp,
        traceId,
        type: "Workspace.Created",
        version: 1
      })
    )
  }

  if (
    type === "WorkspaceMembership.Created"
    && version === 1
    && S.is(WorkspaceMembershipCreatedActivityLog.fields.targets)(targets)
  ) {
    return Effect.succeed(
      new WorkspaceMembershipCreatedActivityLog({
        id,
        performedByUserId,
        targets,
        timestamp,
        traceId,
        type: "WorkspaceMembership.Created",
        version: 1
      })
    )
  }

  return pipe(
    dieWithUnexpectedError("An activity log model could not be converted to a domain entity"),
    Effect.annotateLogs({
      activityLog: {
        id,
        type,
        version
      }
    })
  )
}
