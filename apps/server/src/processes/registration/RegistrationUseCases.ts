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
import { PersonFallbackNameGenerator } from "@one-kilo/domain/values/PersonFallbackNameGenerator"
import { FullName, PreferredName } from "@one-kilo/domain/values/PersonValues"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as PgClientExtensions from "@one-kilo/sql/utils/PgClientExtensions"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as S from "effect/Schema"
import { UsersCreationModule } from "../../modules/users/UsersCreationModule.ts"
import { WorkspacesCreationModule } from "../../modules/workspaces/WorkspacesCreationModule.ts"

type PersistRegistrationParameters = {
  readonly userParameters: {
    readonly id: UserId
    readonly preferredName: PreferredName
    readonly fullName: FullName
    readonly workosUserId: WorkOSIds.UserId
  }
  readonly workspaceParameters: {
    readonly id: WorkspaceId
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
      PersonFallbackNameGenerator.Default,
      UsersCreationModule.Default,
      WorkspacesCreationModule.Default
    ],
    effect: Effect.gen(function*() {
      const { client: workosGatewayClient } = yield* WorkOSApiGateway.ApiGateway
      const { client: workosDirectClient } = yield* WorkOSApiClient.ApiClient

      const idGenerator = yield* DomainIdGenerator
      const fallbackNameGenerator = yield* PersonFallbackNameGenerator
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
          const user = yield* usersCreationModule.createPersonUser({
            id: userParameters.id,
            preferredName: userParameters.preferredName,
            fullName: userParameters.fullName,
            workosUserId: userParameters.workosUserId
          })

          const {
            workspace,
            workspaceMembership
          } = yield* workspacesCreationModule.createPersonalWorkspace({
            id: workspaceParameters.id,
            workosOrganizationId: workspaceParameters.workosOrganizationId,
            userId: userParameters.id,
            workspaceMembershipParameters
          })

          return {
            user,
            workspace,
            workspaceMembership
          }
        },
        PgClientExtensions.withSerializableTransaction(pg)
      )

      const derivePersonNamesFromWorkosUser = Effect.fn("RegistrationUseCases.derivePersonNamesFromWorkosUser")(
        function*({ id, firstName, lastName }: Pick<WorkOSEntities.User, "id" | "firstName" | "lastName">) {
          if (firstName !== null && lastName !== null) {
            const decoded = yield* pipe(
              Effect.all({
                preferredName: S.decode(PreferredName)(firstName),
                fullName: S.decode(FullName)(`${firstName} ${lastName}`)
              }),
              Effect.tapErrorCause((cause) =>
                pipe(
                  Effect.logWarning("Failed to decode person names from a WorkOS user", cause),
                  Effect.annotateLogs({
                    workosUserId: id,
                    workosFirstName: firstName,
                    workosLastName: lastName
                  })
                )
              ),
              Effect.option
            )

            if (Option.isSome(decoded)) {
              return {
                ...decoded.value,
                workosName: { firstName, lastName }
              }
            }
          }

          yield* Effect.logWarning("Failed to derive person names from WorkOS user, using fallback names")

          return yield* Effect.map(
            fallbackNameGenerator.generate,
            (fallback) => ({
              preferredName: fallback.fallbackPreferredName,
              fullName: fallback.fallbackFullName,
              workosName: fallback.fallbackWorkosName
            })
          )
        }
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
          const workosPersonalOrganizationName = `Personal ${workspaceId.slice(-6).toUpperCase()}`

          const { preferredName, fullName, workosName } = yield* derivePersonNamesFromWorkosUser(workosUser)

          const [workosOrganization] = yield* Effect.all(
            [
              pipe(
                workosGatewayClient.organizations.createOrganization({
                  name: workosPersonalOrganizationName,
                  externalId: workspaceId
                }),
                orDieWithUnexpectedError("Failed to create WorkOS organization during registration.")
              ),
              pipe(
                workosGatewayClient.userManagement.updateUser(
                  workosUser.id,
                  {
                    externalId: userId,
                    firstName: workosName.firstName,
                    lastName: workosName.lastName
                  }
                ),
                orDieWithUnexpectedError("Failed to update WorkOS user during registration.")
              )
            ],
            { concurrency: "unbounded" }
          )

          // If there is any failure, attempt to clean up the dangling organization
          yield* Effect.addFinalizer((exit) => {
            if (Exit.isFailure(exit)) {
              return pipe(
                workosGatewayClient.organizations.deleteOrganization(workosOrganization.id),
                Effect.tapErrorCause((cause) => Effect.logWarning("Failed to clean up a WorkOS organization", cause)),
                Effect.ignore
              )
            }

            return Effect.void
          })

          const workosOrganizationMembership = yield* pipe(
            workosGatewayClient.userManagement.createOrganizationMembership({
              userId: workosUser.id,
              organizationId: workosOrganization.id,
              roles: []
            }),
            orDieWithUnexpectedError("Failed to create WorkOS organization membership during registration.")
          )

          const refreshTokenResponse = yield* pipe(
            workosDirectClient.userManagement.authenticateWithRefreshToken({
              refreshToken: inputWorkosRefreshToken,
              organizationId: workosOrganization.id
            }),
            orDieWithUnexpectedError("Failed to refresh WorkOS token within registration.")
          )

          yield* persistRegistration({
            userParameters: {
              id: userId,
              workosUserId: workosUser.id,
              preferredName,
              fullName
            },
            workspaceParameters: {
              id: workspaceId,
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
            workosAccessToken: refreshTokenResponse.accessToken,
            workosRefreshToken: refreshTokenResponse.refreshToken
          }
        },
        Effect.scoped
      )

      return { registerHumanUser }
    })
  }
) {}
