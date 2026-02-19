import * as WorkOSApiClient from "@effect/auth-workos/ApiClient"
import * as WorkOSApiGateway from "@effect/auth-workos/ApiGateway"
import * as WorkOSEntities from "@effect/auth-workos/domain/Entities"
import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as WorkOSValues from "@effect/auth-workos/domain/Values"
import { UserIdGenerator } from "@one-kilo/domain/ids/UserId"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import { WorkspaceIdGenerator } from "@one-kilo/domain/ids/WorkspaceId"
import type { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"

type ExecuteRegistrationParameters = {
  readonly userId: UserId
  readonly workspaceId: WorkspaceId

  readonly workosOrganizationId: WorkOSIds.OrganizationId
  readonly workosOrganizationMembershipId: WorkOSIds.OrganizationMembershipId
  readonly workosUser: WorkOSEntities.User
}

type RegisterHumanUserParameters = {
  readonly workosRefreshToken: WorkOSValues.RefreshToken
  readonly workosUser: WorkOSEntities.User
}

export class RegistrationProcesses extends Effect.Service<RegistrationProcesses>()(
  "@one-kilo/server/RegistrationProcesses",
  {
    dependencies: [
      UserIdGenerator.Default,
      WorkspaceIdGenerator.Default
    ],
    effect: Effect.gen(function*() {
      const { client: workosGatewayClient } = yield* WorkOSApiGateway.ApiGateway
      const { client: workosDirectClient } = yield* WorkOSApiClient.ApiClient

      const userIdGenerator = yield* UserIdGenerator
      const workspaceIdGenerator = yield* WorkspaceIdGenerator

      const persist = Effect.fn("RegistrationProcesses.persist")(
        function*(
          {
            userId: _userId,
            workspaceId: _workspaceId,
            workosOrganizationId: _workosOrganizationId,
            workosOrganizationMembershipId: _workosOrganizationMembershipId,
            workosUser: _workosUser
          }: ExecuteRegistrationParameters
        ) {
          /*
            4. DB transaction:                     ← all internal, atomic
                - insert user
                - insert workspace (using WorkOS org ID)
                - insert workspace membership
          */

          // User Module
          // Workspace Module
          // Workspace Membership Module
        }
      )

      const registerHumanUser = Effect.fn("RegistrationProcesses.registerHumanUser")(
        function*({
          workosRefreshToken: inputWorkosRefreshToken,
          workosUser
        }: RegisterHumanUserParameters) {
          const userId = yield* userIdGenerator.generate
          const workspaceId = yield* workspaceIdGenerator.generate

          // Special suffix is intended to support debugging through the WorkOS console.
          const workosOrganizationName = `Personal (${workspaceId.slice(-6)})`

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

          yield* persist({
            userId,
            workspaceId,
            workosOrganizationId: workosOrganization.id,
            workosOrganizationMembershipId: workosOrganizationMembership.id,
            workosUser
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
