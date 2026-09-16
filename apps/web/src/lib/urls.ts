import type { AccountId } from "@one-kilo/domain/ids/AccountId"
import type { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"

export const buildAccountPageUrl = (accountId: AccountId) => `/accounts/${accountId}` as const

export const buildWorkspacePageUrl = (workspaceId: WorkspaceId) => `/ws/${workspaceId}` as const
