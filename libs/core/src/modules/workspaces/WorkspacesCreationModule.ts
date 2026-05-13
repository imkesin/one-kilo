import type * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { WorkspaceCreatedAuditLog } from "@one-kilo/domain/audit-logs/WorkspaceAuditLogs"
import { WorkspaceMembershipCreatedAuditLog } from "@one-kilo/domain/audit-logs/WorkspaceMembershipAuditLogs"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import type { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import type { WorkspaceMembershipId } from "@one-kilo/domain/ids/WorkspaceMembershipId"
import { WorkspaceName } from "@one-kilo/domain/values/WorkspaceValues"
import { dieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import { AuditLogsRepository } from "@one-kilo/sql/modules/audit-logs/AuditLogsRepository"
import { WorkspaceMembershipsRepository } from "@one-kilo/sql/modules/workspaces/WorkspaceMembershipsRepository"
import { WorkspacesQueryRepository } from "@one-kilo/sql/modules/workspaces/WorkspacesQueryRepository"
import { WorkspacesRepository } from "@one-kilo/sql/modules/workspaces/WorkspacesRepository"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"

type CreatePersonalWorkspaceParameters = {
  id: WorkspaceId
  workosOrganizationId: WorkOSIds.OrganizationId

  userId: UserId
  workspaceMembershipParameters: {
    id: WorkspaceMembershipId
    workosOrganizationMembershipId: WorkOSIds.OrganizationMembershipId
  }
}

export class WorkspacesCreationModule extends Effect.Service<WorkspacesCreationModule>()(
  "@one-kilo/core/WorkspacesCreationModule",
  {
    dependencies: [
      AuditLogsRepository.Default,
      DomainIdGenerator.Default,
      WorkspaceMembershipsRepository.Default,
      WorkspacesQueryRepository.Default,
      WorkspacesRepository.Default
    ],
    effect: Effect.gen(function*() {
      const auditLogsRepository = yield* AuditLogsRepository
      const idGenerator = yield* DomainIdGenerator
      const workspaceMembershipsRepository = yield* WorkspaceMembershipsRepository
      const workspacesQueryRepository = yield* WorkspacesQueryRepository
      const workspacesRepository = yield* WorkspacesRepository

      const recordWorkspaceCreated = Effect.fn("WorkspacesCreationModule.recordWorkspaceCreated")(
        function*(workspace: { id: WorkspaceId }, performedByUserId: UserId) {
          const id = yield* idGenerator.auditLogId

          const auditLog = yield* WorkspaceCreatedAuditLog.build({
            id,
            performedByUserId,
            targets: [{ id: workspace.id, type: "Workspace" as const }]
          })

          yield* auditLogsRepository.insert({
            ...auditLog,
            encodedContext: Option.none()
          })
        }
      )

      const recordWorkspaceMembershipCreated = Effect.fn(
        "WorkspacesCreationModule.recordWorkspaceMembershipCreated"
      )(
        function*(
          workspaceMembership: { id: WorkspaceMembershipId; userId: UserId; workspaceId: WorkspaceId },
          performedByUserId: UserId
        ) {
          const id = yield* idGenerator.auditLogId

          const auditLog = yield* WorkspaceMembershipCreatedAuditLog.build({
            id,
            performedByUserId,
            targets: [
              { id: workspaceMembership.userId, type: "User" as const },
              { id: workspaceMembership.workspaceId, type: "Workspace" as const },
              { id: workspaceMembership.id, type: "WorkspaceMembership" as const }
            ]
          })

          yield* auditLogsRepository.insert({
            ...auditLog,
            encodedContext: Option.none()
          })
        }
      )

      const createPersonalWorkspace = Effect.fn("WorkspacesCreationModule.createPersonalWorkspace")(
        function*({
          id,
          workosOrganizationId,
          userId,
          workspaceMembershipParameters
        }: CreatePersonalWorkspaceParameters) {
          yield* pipe(
            workspacesQueryRepository.findPersonalWorkspaceAndMembershipEntitiesByUserId({ userId }),
            Effect.andThen(
              Option.match({
                onNone: () => Effect.ignore,
                onSome: () => dieWithUnexpectedError("A personal workspace already exists for this user")
              })
            )
          )

          const workspace = yield* workspacesRepository.insert({
            id,
            name: WorkspaceName.make("Personal"),
            type: "Personal",
            workosOrganizationId,
            performedByUserId: userId
          })

          const workspaceMembership = yield* workspaceMembershipsRepository.insert({
            id: workspaceMembershipParameters.id,
            userId,
            workspaceId: workspace.id,
            role: "Owner",
            workosOrganizationMembershipId: workspaceMembershipParameters.workosOrganizationMembershipId
          })

          yield* Effect.all([
            recordWorkspaceCreated(workspace, userId),
            recordWorkspaceMembershipCreated(workspaceMembership, userId)
          ], { concurrency: "unbounded" })

          return { workspace, workspaceMembership }
        }
      )

      return { createPersonalWorkspace }
    })
  }
) {}
