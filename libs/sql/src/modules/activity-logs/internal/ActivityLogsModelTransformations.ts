import { UserCreatedActivityLog } from "@one-kilo/domain/activity-logs/UserActivityLogs"
import { dieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import type { ActivityLogsModel } from "../ActivityLogsModel.ts"

export const toActivityLog = ({
  id,
  performedByUserId,
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
