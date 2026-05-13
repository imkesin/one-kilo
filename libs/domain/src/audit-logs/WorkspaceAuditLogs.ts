import * as TracingExtensions from "@one-kilo/lib/telemetry/TracingExtensions"
import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import * as S from "effect/Schema"
import { WorkspaceId } from "../ids/WorkspaceId.ts"
import * as AuditBuilder from "./AuditBuilder.ts"

const WorkspaceAuditLogBuilder = AuditBuilder.make({
  id: WorkspaceId,
  type: "Workspace"
})

export class WorkspaceCreatedAuditLog
  extends S.Class<WorkspaceCreatedAuditLog>("@one-kilo/domain/WorkspaceCreatedAuditLog")(
    WorkspaceAuditLogBuilder.Audit({ type: "Workspace.Created" }),
    {
      title: "Workspace Created Audit Log",
      description: "A log marking the creation of a workspace"
    }
  )
{
  static build = Effect.fnUntraced(
    function*(parameters: Omit<typeof WorkspaceCreatedAuditLog.Type, "timestamp" | "traceId" | "type" | "version">) {
      const timestamp = yield* DateTime.now
      const traceId = yield* TracingExtensions.nearestTraceId

      return WorkspaceCreatedAuditLog.make({ timestamp, traceId, ...parameters })
    }
  )
}
