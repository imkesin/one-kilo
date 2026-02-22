import * as WorkOSApiClient from "@effect/auth-workos/ApiClient"
import * as WorkOSApiGateway from "@effect/auth-workos/ApiGateway"
import * as WorkOSEntities from "@effect/auth-workos/domain/Entities"
import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as WorkOSValues from "@effect/auth-workos/domain/Values"
import * as PgClient from "@effect/sql-pg/PgClient"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import type { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import type { WorkspaceMembershipId } from "@one-kilo/domain/ids/WorkspaceMembershipId"
import * as PgClientExtensions from "@one-kilo/sql/utils/PgClientExtensions"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { UsersCreationModule } from "../../modules/users/UsersCreationModule.ts"
import { WorkspacesCreationModule } from "../../modules/workspaces/WorkspacesCreationModule.ts"

type PersistRegistrationParameters = {
  readonly userParameters: {
    readonly id: UserId
    readonly workosUser: WorkOSEntities.User
  }
  readonly workspaceParameters: {
    readonly id: WorkspaceId
    readonly name: string
    readonly workosOrganizationId: WorkOSIds.OrganizationId
  }
  readonly workspaceMembershipParameters: {
    readonly id: WorkspaceMembershipId
    readonly workosOrganizationMembershipId: WorkOSIds.OrganizationMembershipId
  }
}

type RegisterHumanUserParameters = {
  readonly workosRefreshToken: WorkOSValues.RefreshToken
  readonly workosUser: WorkOSEntities.User
}

export class RegistrationUseCases extends Effect.Service<RegistrationUseCases>()(
  "@one-kilo/server/RegistrationUseCases",
  {
    dependencies: [
      DomainIdGenerator.Default,
      UsersCreationModule.Default,
      WorkspacesCreationModule.Default
    ],
    effect: Effect.gen(function*() {
      const { client: workosGatewayClient } = yield* WorkOSApiGateway.ApiGateway
      const { client: workosDirectClient } = yield* WorkOSApiClient.ApiClient

      const idGenerator = yield* DomainIdGenerator
      const usersCreationModule = yield* UsersCreationModule
      const workspacesCreationModule = yield* WorkspacesCreationModule

      const pg = yield* PgClient.PgClient

      const persistRegistration = Effect.fn("RegistrationUseCases.persistRegistration")(
        function*(
          {
            userParameters,
            workspaceParameters,
            workspaceMembershipParameters
          }: PersistRegistrationParameters
        ) {
          const [
            user,
            workspace
          ] = yield* Effect.all([
            usersCreationModule.createHumanUser({
              id: userParameters.id,
              workosUserId: userParameters.workosUser.id
            }),
            workspacesCreationModule.createWorkspace({
              id: workspaceParameters.id,
              name: workspaceParameters.name,
              performedByUserId: userParameters.id,
              workosOrganizationId: workspaceParameters.workosOrganizationId
            })
          ], { concurrency: "unbounded" })

          const workspaceMembership = yield* workspacesCreationModule.addUserToPersonalWorkspace({
            id: workspaceMembershipParameters.id,
            userId: userParameters.id,
            workspaceId: workspaceParameters.id
          })

          return {
            user,
            workspace,
            workspaceMembership
          }
        },
        PgClientExtensions.withSerializableTransaction(pg)
      )

      const registerHumanUser = Effect.fn("RegistrationUseCases.registerHumanUser")(
        function*({
          workosRefreshToken: inputWorkosRefreshToken,
          workosUser
        }: RegisterHumanUserParameters) {
          const userId = yield* idGenerator.userId
          const workspaceId = yield* idGenerator.workspaceId
          const workspaceMembershipId = yield* idGenerator.workspaceMembershipId

          // Special suffix is intended to support debugging through the WorkOS console.
          const workosOrganizationName = `Personal (${workspaceId.slice(-6)})`

          // TODO: I need to give the user a name right here

          const [workosOrganization] = yield* Effect.all(
            [
              workosGatewayClient.organizations.createOrganization({
                name: workosOrganizationName,
                externalId: workspaceId
              }),
              workosGatewayClient.userManagement.updateUser(
                workosUser.id,
                { externalId: userId }
              )
            ],
            { concurrency: "unbounded" }
          )

          // If there is any failure, attempt to clean up the dangling organization
          yield* Effect.addFinalizer((exit) => {
            if (Exit.isFailure(exit)) {
              return workosGatewayClient.organizations.deleteOrganization(workosOrganization.id)
            }

            return Effect.void
          })

          const workosOrganizationMembership = yield* workosGatewayClient.userManagement.createOrganizationMembership({
            userId: workosUser.id,
            organizationId: workosOrganization.id,
            roles: []
          })

          const refreshTokenResult = yield* workosDirectClient.userManagement.authenticateWithRefreshToken({
            refreshToken: inputWorkosRefreshToken,
            organizationId: workosOrganization.id
          })

          yield* persistRegistration({
            userParameters: {
              id: userId,
              workosUser
            },
            workspaceParameters: {
              id: workspaceId,
              name: workosOrganizationName,
              workosOrganizationId: workosOrganization.id
            },
            workspaceMembershipParameters: {
              id: workspaceMembershipId,
              workosOrganizationMembershipId: workosOrganizationMembership.id
            }
          })

          return {
            userId,
            workspaceId,
            workosAccessToken: refreshTokenResult.accessToken,
            workosRefreshToken: refreshTokenResult.refreshToken
          }
        }
      )

      return { registerHumanUser }
    })
  }
) {}
