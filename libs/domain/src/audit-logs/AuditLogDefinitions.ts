import type * as AccountAuditLogs from "./AccountAuditLogs.ts"
import type * as AthleteAuditLogs from "./AthleteAuditLogs.ts"
import type * as PersonAuditLogs from "./PersonAuditLogs.ts"
import type * as WorkspaceAuditLogs from "./WorkspaceAuditLogs.ts"
import type * as WorkspaceMembershipAuditLogs from "./WorkspaceMembershipAuditLogs.ts"

export type AuditLog =
  | AthleteAuditLogs.AthleteCreatedAuditLog
  | PersonAuditLogs.PersonUpdatedAuditLog
  | AccountAuditLogs.AccountCreatedAuditLog
  | WorkspaceAuditLogs.WorkspaceCreatedAuditLog
  | WorkspaceMembershipAuditLogs.WorkspaceMembershipCreatedAuditLog

export type AuditLogType = AuditLog["type"]
export type AuditLogTarget = AuditLog["targets"][number]
