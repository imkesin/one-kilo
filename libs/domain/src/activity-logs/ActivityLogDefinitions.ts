import type * as UserActivityLogs from "./UserActivityLogs.ts"

export type ActivityLog = UserActivityLogs.UserCreatedActivityLog

export type ActivityLogType = ActivityLog["type"]
export type ActivityLogTarget = ActivityLog["targets"][number]
