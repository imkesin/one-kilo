import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import type { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import type { WorkspaceMembershipId } from "@one-kilo/domain/ids/WorkspaceMembershipId"
import { WorkspaceName } from "@one-kilo/domain/values/WorkspaceValues"
import { dieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
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
      WorkspacesQueryRepository.Default,
      WorkspacesRepository.Default
    ],
    effect: Effect.gen(function*() {
      const workspacesQueryRepository = yield* WorkspacesQueryRepository
      const workspacesRepository = yield* WorkspacesRepository

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

          const workspaceMembership = yield* workspacesRepository.insertMembership({
            id: workspaceMembershipParameters.id,
            userId,
            workspaceId: workspace.id,
            role: "Owner",
            workosOrganizationMembershipId: workspaceMembershipParameters.workosOrganizationMembershipId
          })

          return { workspace, workspaceMembership }
        }
      )

      return { createPersonalWorkspace }
    })
  }
) {}
