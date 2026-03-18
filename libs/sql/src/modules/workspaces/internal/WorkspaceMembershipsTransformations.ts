import { WorkspaceMembership } from "@one-kilo/domain/entities/WorkspaceMembership"
import type { WorkspaceMembershipsModel } from "../WorkspaceMembershipsModel.ts"

type WorkspaceMembershipModelSelect = typeof WorkspaceMembershipsModel.select.Type

export const toWorkspaceMembershipEntity = ({
  id,
  userId,
  workspaceId,
  role,
  workosOrganizationMembershipId,
  createdAt,
  updatedAt,
  archivedAt
}: WorkspaceMembershipModelSelect): WorkspaceMembership =>
  WorkspaceMembership.make({
    id,
    userId,
    workspaceId,
    role,
    workosOrganizationMembershipId,
    addedAt: createdAt,
    updatedAt: updatedAt,
    removedAt: archivedAt
  })
