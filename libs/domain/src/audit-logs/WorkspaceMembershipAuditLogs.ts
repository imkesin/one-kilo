import * as TracingExtensions from "@one-kilo/lib/telemetry/TracingExtensions"
import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import * as S from "effect/Schema"
import { AccountId } from "../ids/AccountId.ts"
import { WorkspaceId } from "../ids/WorkspaceId.ts"
import { WorkspaceMembershipId } from "../ids/WorkspaceMembershipId.ts"
import { AccountVersion } from "../versions/AccountVersion.ts"
import { WorkspaceMembershipVersion } from "../versions/WorkspaceMembershipVersion.ts"
import { WorkspaceVersion } from "../versions/WorkspaceVersion.ts"
import * as AuditBuilder from "./AuditBuilder.ts"

const WorkspaceMembershipAuditLogBuilder = AuditBuilder.make(
  {
    id: AccountId,
    type: "Account",
    version: AccountVersion
  },
  {
    id: WorkspaceId,
    type: "Workspace",
    version: WorkspaceVersion
  },
  {
    id: WorkspaceMembershipId,
    type: "WorkspaceMembership",
    version: WorkspaceMembershipVersion
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
      parameters: Omit<WorkspaceMembershipCreatedAuditLog, "timestamp" | "traceId" | "type" | "schemaVersion">
    ) {
      const timestamp = yield* DateTime.now
      const traceId = yield* TracingExtensions.nearestTraceId

      return WorkspaceMembershipCreatedAuditLog.make({ timestamp, traceId, ...parameters })
    }
  )
}
