import { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"

export const buildWorkspacePageUrl = (workspaceId: WorkspaceId) => `/ws/${workspaceId}` as const
