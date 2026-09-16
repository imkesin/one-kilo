import type * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { WorkspaceCreatedAuditLog } from "@one-kilo/domain/audit-logs/WorkspaceAuditLogs"
import { WorkspaceMembershipCreatedAuditLog } from "@one-kilo/domain/audit-logs/WorkspaceMembershipAuditLogs"
import type { AccountId } from "@one-kilo/domain/ids/AccountId"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
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

  accountId: AccountId
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
        function*(workspace: { id: WorkspaceId }, performedByAccountId: AccountId) {
          const id = yield* idGenerator.auditLogId

          const auditLog = yield* WorkspaceCreatedAuditLog.build({
            id,
            performedByAccountId,
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
          workspaceMembership: { id: WorkspaceMembershipId; accountId: AccountId; workspaceId: WorkspaceId },
          performedByAccountId: AccountId
        ) {
          const id = yield* idGenerator.auditLogId

          const auditLog = yield* WorkspaceMembershipCreatedAuditLog.build({
            id,
            performedByAccountId,
            targets: [
              { id: workspaceMembership.accountId, type: "Account" as const },
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
          accountId,
          workspaceMembershipParameters
        }: CreatePersonalWorkspaceParameters) {
          yield* pipe(
            workspacesQueryRepository.findPersonalWorkspaceAndMembershipEntitiesByAccountId({ accountId }),
            Effect.andThen(
              Option.match({
                onNone: () => Effect.ignore,
                onSome: () => dieWithUnexpectedError("A personal workspace already exists for this account")
              })
            )
          )

          const workspace = yield* workspacesRepository.insert({
            id,
            name: WorkspaceName.make("Personal"),
            type: "Personal",
            workosOrganizationId,
            performedByAccountId: accountId
          })

          const workspaceMembership = yield* workspaceMembershipsRepository.insert({
            id: workspaceMembershipParameters.id,
            accountId,
            workspaceId: workspace.id,
            role: "Owner",
            workosOrganizationMembershipId: workspaceMembershipParameters.workosOrganizationMembershipId
          })

          yield* Effect.all([
            recordWorkspaceCreated(workspace, accountId),
            recordWorkspaceMembershipCreated(workspaceMembership, accountId)
          ], { concurrency: "unbounded" })

          return { workspace, workspaceMembership }
        }
      )

      return { createPersonalWorkspace }
    })
  }
) {}
