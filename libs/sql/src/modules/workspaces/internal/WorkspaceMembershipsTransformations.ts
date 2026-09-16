import { WorkspaceMembership } from "@one-kilo/domain/entities/WorkspaceMembership"
import type { WorkspaceMembershipsModel } from "../WorkspaceMembershipsModel.ts"

export const toWorkspaceMembershipEntity = ({
  id,
  accountId,
  workspaceId,
  role,
  workosOrganizationMembershipId,
  createdAt,
  updatedAt,
  archivedAt
}: typeof WorkspaceMembershipsModel.select.Type) =>
  WorkspaceMembership.make({
    id,
    accountId,
    workspaceId,
    role,
    workosOrganizationMembershipId,
    addedAt: createdAt,
    updatedAt: updatedAt,
    removedAt: archivedAt
  })
