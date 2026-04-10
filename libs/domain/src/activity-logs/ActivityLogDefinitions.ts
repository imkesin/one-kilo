import type * as UserActivityLogs from "./UserActivityLogs.ts"
import type * as WorkspaceActivityLogs from "./WorkspaceActivityLogs.ts"
import type * as WorkspaceMembershipActivityLogs from "./WorkspaceMembershipActivityLogs.ts"

export type ActivityLog =
  | UserActivityLogs.UserCreatedActivityLog
  | WorkspaceActivityLogs.WorkspaceCreatedActivityLog
  | WorkspaceMembershipActivityLogs.WorkspaceMembershipCreatedActivityLog

export type ActivityLogType = ActivityLog["type"]
export type ActivityLogTarget = ActivityLog["targets"][number]
