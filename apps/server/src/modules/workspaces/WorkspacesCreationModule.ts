import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { WorkspaceCreatedActivityLog } from "@one-kilo/domain/activity-logs/WorkspaceActivityLogs"
import { WorkspaceMembershipCreatedActivityLog } from "@one-kilo/domain/activity-logs/WorkspaceMembershipActivityLogs"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import type { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import type { WorkspaceMembershipId } from "@one-kilo/domain/ids/WorkspaceMembershipId"
import { WorkspaceName } from "@one-kilo/domain/values/WorkspaceValues"
import { dieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import { ActivityLogsRepository } from "@one-kilo/sql/modules/activity-logs/ActivityLogsRepository"
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
  "@one-kilo/server/WorkspacesCreationModule",
  {
    dependencies: [
      ActivityLogsRepository.Default,
      DomainIdGenerator.Default,
      WorkspaceMembershipsRepository.Default,
      WorkspacesQueryRepository.Default,
      WorkspacesRepository.Default
    ],
    effect: Effect.gen(function*() {
      const activityLogsRepository = yield* ActivityLogsRepository
      const idGenerator = yield* DomainIdGenerator
      const workspaceMembershipsRepository = yield* WorkspaceMembershipsRepository
      const workspacesQueryRepository = yield* WorkspacesQueryRepository
      const workspacesRepository = yield* WorkspacesRepository

      const recordWorkspaceCreated = Effect.fn("WorkspacesCreationModule.recordWorkspaceCreated")(
        function*(workspace: { id: WorkspaceId }, performedByUserId: UserId) {
          const id = yield* idGenerator.activityLogId

          const activityLog = yield* WorkspaceCreatedActivityLog.build({
            id,
            performedByUserId,
            targets: [{ id: workspace.id, type: "Workspace" as const }]
          })

          yield* activityLogsRepository.insert({
            ...activityLog,
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
          const id = yield* idGenerator.activityLogId

          const activityLog = yield* WorkspaceMembershipCreatedActivityLog.build({
            id,
            performedByUserId,
            targets: [
              { id: workspaceMembership.userId, type: "User" as const },
              { id: workspaceMembership.workspaceId, type: "Workspace" as const },
              { id: workspaceMembership.id, type: "WorkspaceMembership" as const }
            ]
          })

          yield* activityLogsRepository.insert({
            ...activityLog,
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
