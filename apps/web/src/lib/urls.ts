import type { UserId } from "@one-kilo/domain/ids/UserId"
import type { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"

export const buildUserPageUrl = (userId: UserId) => `/u/${userId}` as const

export const buildWorkspacePageUrl = (workspaceId: WorkspaceId) => `/ws/${workspaceId}` as const
