import * as TracingExtensions from "@one-kilo/lib/telemetry/TracingExtensions"
import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import * as S from "effect/Schema"
import { WorkspaceId } from "../ids/WorkspaceId.ts"
import * as ActivityBuilder from "./ActivityBuilder.ts"

const WorkspaceActivityLogBuilder = ActivityBuilder.make({
  id: WorkspaceId,
  type: "Workspace"
})

export class WorkspaceCreatedActivityLog
  extends S.Class<WorkspaceCreatedActivityLog>("@one-kilo/domain/WorkspaceCreatedActivityLog")(
    WorkspaceActivityLogBuilder.Activity({ type: "Workspace.Created" }),
    {
      title: "Workspace Created Activity Log",
      description: "A log marking the creation of a workspace"
    }
  )
{
  static build = Effect.fnUntraced(
    function*(parameters: Omit<typeof WorkspaceCreatedActivityLog.Type, "timestamp" | "traceId" | "type" | "version">) {
      const timestamp = yield* DateTime.now
      const traceId = yield* TracingExtensions.nearestTraceId

      return WorkspaceCreatedActivityLog.make({ timestamp, traceId, ...parameters })
    }
  )
}
