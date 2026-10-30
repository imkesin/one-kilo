import type * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { WorkspaceCreatedAuditLog } from "@one-kilo/domain/audit-logs/WorkspaceAuditLogs"
import { WorkspaceMembershipCreatedAuditLog } from "@one-kilo/domain/audit-logs/WorkspaceMembershipAuditLogs"
import type { AccountId } from "@one-kilo/domain/ids/AccountId"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import type { WorkspaceMembershipId } from "@one-kilo/domain/ids/WorkspaceMembershipId"
import { WorkspaceName } from "@one-kilo/domain/values/WorkspaceValues"
import type { AccountVersion } from "@one-kilo/domain/versions/AccountVersion"
import type { WorkspaceMembershipVersion } from "@one-kilo/domain/versions/WorkspaceMembershipVersion"
import type { WorkspaceVersion } from "@one-kilo/domain/versions/WorkspaceVersion"
import { dieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import { AuditLogsRepository } from "@one-kilo/sql/modules/audit-logs/AuditLogsRepository"
import { WorkspaceMembershipsRepository } from "@one-kilo/sql/modules/workspaces/WorkspaceMembershipsRepository"
import { WorkspacesQueryRepository } from "@one-kilo/sql/modules/workspaces/WorkspacesQueryRepository"
import { WorkspacesRepository } from "@one-kilo/sql/modules/workspaces/WorkspacesRepository"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"

type CreatePersonalWorkspaceParameters = {
  id: WorkspaceId
  workosOrganizationId: WorkOSIds.OrganizationId

  account: { id: AccountId; version: AccountVersion }
  workspaceMembershipParameters: {
    id: WorkspaceMembershipId
    workosOrganizationMembershipId: WorkOSIds.OrganizationMembershipId
  }
}

export class WorkspacesCreationModule extends Context.Service<WorkspacesCreationModule>()(
  "@one-kilo/core/WorkspacesCreationModule",
  {
    make: Effect.gen(function*() {
      const auditLogsRepository = yield* AuditLogsRepository
      const idGenerator = yield* DomainIdGenerator
      const workspaceMembershipsRepository = yield* WorkspaceMembershipsRepository
      const workspacesQueryRepository = yield* WorkspacesQueryRepository
      const workspacesRepository = yield* WorkspacesRepository

      const recordWorkspaceCreated = Effect.fn("WorkspacesCreationModule.recordWorkspaceCreated")(
        function*(workspace: { id: WorkspaceId; version: WorkspaceVersion }, performedByAccountId: AccountId) {
          const id = yield* idGenerator.auditLogId

          const auditLog = yield* WorkspaceCreatedAuditLog.build({
            id,
            performedByAccountId,
            targets: [{ id: workspace.id, type: "Workspace" as const, version: workspace.version }]
          })

          yield* auditLogsRepository.insert(auditLog)
        }
      )

      const recordWorkspaceMembershipCreated = Effect.fn(
        "WorkspacesCreationModule.recordWorkspaceMembershipCreated"
      )(
        function*(
          {
            account,
            workspace,
            workspaceMembership
          }: {
            account: { id: AccountId; version: AccountVersion }
            workspace: { id: WorkspaceId; version: WorkspaceVersion }
            workspaceMembership: { id: WorkspaceMembershipId; version: WorkspaceMembershipVersion }
          },
          performedByAccountId: AccountId
        ) {
          const id = yield* idGenerator.auditLogId

          const auditLog = yield* WorkspaceMembershipCreatedAuditLog.build({
            id,
            performedByAccountId,
            targets: [
              { id: account.id, type: "Account" as const, version: account.version },
              { id: workspace.id, type: "Workspace" as const, version: workspace.version },
              {
                id: workspaceMembership.id,
                type: "WorkspaceMembership" as const,
                version: workspaceMembership.version
              }
            ]
          })

          yield* auditLogsRepository.insert(auditLog)
        }
      )

      const createPersonalWorkspace = Effect.fn("WorkspacesCreationModule.createPersonalWorkspace")(
        function*({
          id,
          workosOrganizationId,
          account,
          workspaceMembershipParameters
        }: CreatePersonalWorkspaceParameters) {
          yield* pipe(
            workspacesQueryRepository.findPersonalWorkspaceAndMembershipEntitiesByAccountId({ accountId: account.id }),
            Effect.andThen(
              Option.match({
                onNone: () => Effect.void,
                onSome: () => dieWithUnexpectedError("A personal workspace already exists for this account")
              })
            )
          )

          const workspace = yield* workspacesRepository.insert({
            id,
            name: WorkspaceName.make("Personal"),
            type: "Personal",
            workosOrganizationId,
            performedByAccountId: account.id
          })

          const workspaceMembership = yield* workspaceMembershipsRepository.insert({
            id: workspaceMembershipParameters.id,
            accountId: account.id,
            workspaceId: workspace.id,
            role: "Owner",
            workosOrganizationMembershipId: workspaceMembershipParameters.workosOrganizationMembershipId
          })

          yield* Effect.all([
            recordWorkspaceCreated(workspace, account.id),
            recordWorkspaceMembershipCreated({ account, workspace, workspaceMembership }, account.id)
          ], { concurrency: "unbounded" })

          return { workspace, workspaceMembership }
        }
      )

      return { createPersonalWorkspace }
    })
  }
) {
  static readonly layer = pipe(
    Layer.effect(this, this.make),
    Layer.provide([
      AuditLogsRepository.layer,
      DomainIdGenerator.layer,
      WorkspaceMembershipsRepository.layer,
      WorkspacesQueryRepository.layer,
      WorkspacesRepository.layer
    ])
  )
}
