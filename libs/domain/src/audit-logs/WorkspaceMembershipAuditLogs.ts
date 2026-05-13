import * as TracingExtensions from "@one-kilo/lib/telemetry/TracingExtensions"
import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import * as S from "effect/Schema"
import { UserId } from "../ids/UserId.ts"
import { WorkspaceId } from "../ids/WorkspaceId.ts"
import { WorkspaceMembershipId } from "../ids/WorkspaceMembershipId.ts"
import * as AuditBuilder from "./AuditBuilder.ts"

const WorkspaceMembershipAuditLogBuilder = AuditBuilder.make(
  {
    id: UserId,
    type: "User"
  },
  {
    id: WorkspaceId,
    type: "Workspace"
  },
  {
    id: WorkspaceMembershipId,
    type: "WorkspaceMembership"
  }
)

export class WorkspaceMembershipCreatedAuditLog
  extends S.Class<WorkspaceMembershipCreatedAuditLog>("@one-kilo/domain/WorkspaceMembershipCreatedAuditLog")(
    WorkspaceMembershipAuditLogBuilder.Audit({ type: "WorkspaceMembership.Created" }),
    {
      title: "Workspace Membership Created Audit Log",
      description: "A log marking the creation of a workspace membership"
    }
  )
{
  static build = Effect.fnUntraced(
    function*(
      parameters: Omit<typeof WorkspaceMembershipCreatedAuditLog.Type, "timestamp" | "traceId" | "type" | "version">
    ) {
      const timestamp = yield* DateTime.now
      const traceId = yield* TracingExtensions.nearestTraceId

      return WorkspaceMembershipCreatedAuditLog.make({ timestamp, traceId, ...parameters })
    }
  )
}
