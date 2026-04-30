import type * as PersonActivityLogs from "./PersonActivityLogs.ts"
import type * as UserActivityLogs from "./UserActivityLogs.ts"
import type * as WorkspaceActivityLogs from "./WorkspaceActivityLogs.ts"
import type * as WorkspaceMembershipActivityLogs from "./WorkspaceMembershipActivityLogs.ts"

export type ActivityLog =
  | PersonActivityLogs.PersonUpdatedActivityLog
  | UserActivityLogs.UserCreatedActivityLog
  | WorkspaceActivityLogs.WorkspaceCreatedActivityLog
  | WorkspaceMembershipActivityLogs.WorkspaceMembershipCreatedActivityLog

export type ActivityLogType = ActivityLog["type"]
export type ActivityLogTarget = ActivityLog["targets"][number]
