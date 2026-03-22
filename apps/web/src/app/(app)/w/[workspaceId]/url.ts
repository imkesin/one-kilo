import { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"

export const buildWorkspacePageUrl = (workspaceId: WorkspaceId) => `/w/${workspaceId}` as const
