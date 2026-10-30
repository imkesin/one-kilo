import * as WorkOSApiGateway from "@effect/auth-workos/ApiGateway"
import type * as WorkOSEntities from "@effect/auth-workos/domain/Entities"
import type * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as PgClient from "@effect/sql-pg/PgClient"
import type { AccountId } from "@one-kilo/domain/ids/AccountId"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import type { WorkspaceMembershipId } from "@one-kilo/domain/ids/WorkspaceMembershipId"
import { EmailAddress } from "@one-kilo/domain/values/EmailAddressValues"
import { PersonFallbackNameGenerator } from "@one-kilo/domain/values/PersonFallbackNameGenerator"
import { FullName, PreferredName } from "@one-kilo/domain/values/PersonValues"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as PgClientExtensions from "@one-kilo/sql/utils/PgClientExtensions"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as S from "effect/Schema"
import { AccountsCreationModule } from "../../modules/accounts/AccountsCreationModule.ts"
import { WorkspacesCreationModule } from "../../modules/workspaces/WorkspacesCreationModule.ts"

type PersistRegistrationParameters = {
  readonly accountParameters: {
    readonly id: AccountId
    readonly preferredName: PreferredName
    readonly fullName: FullName
    readonly emailAddress: EmailAddress
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

type RegisterAccountForPersonParameters = {
  readonly workosUser: WorkOSEntities.User
}

export class RegistrationUseCases extends Context.Service<RegistrationUseCases>()(
  "@one-kilo/core/RegistrationUseCases",
  {
    make: Effect.gen(function*() {
      const pg = yield* PgClient.PgClient
      const workosGatewayClient = yield* WorkOSApiGateway.ApiGateway

      const idGenerator = yield* DomainIdGenerator
      const fallbackNameGenerator = yield* PersonFallbackNameGenerator
      const accountsCreationModule = yield* AccountsCreationModule
      const workspacesCreationModule = yield* WorkspacesCreationModule

      const persistRegistration = Effect.fn("RegistrationUseCases.persistRegistration")(
        function*(
          {
            accountParameters,
            workspaceParameters,
            workspaceMembershipParameters
          }: PersistRegistrationParameters
        ) {
          const account = yield* accountsCreationModule.createAccountForPerson({
            id: accountParameters.id,
            preferredName: accountParameters.preferredName,
            fullName: accountParameters.fullName,
            emailAddress: accountParameters.emailAddress,
            workosUserId: accountParameters.workosUserId
          })

          const {
            workspace,
            workspaceMembership
          } = yield* workspacesCreationModule.createPersonalWorkspace({
            id: workspaceParameters.id,
            workosOrganizationId: workspaceParameters.workosOrganizationId,
            account,
            workspaceMembershipParameters
          })

          return {
            account,
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
                preferredName: S.decodeEffect(PreferredName)(firstName),
                fullName: S.decodeEffect(FullName)(`${firstName} ${lastName}`)
              }),
              Effect.tapCause((cause) =>
                pipe(
                  Effect.logWarning("Failed to decode person names from a WorkOS user", cause),
                  Effect.annotateLogs({
                    workosUser: {
                      id,
                      firstName,
                      lastName
                    }
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

      const registerAccountForPerson = Effect.fn("RegistrationUseCases.registerAccountForPerson")(
        function*({
          workosUser
        }: RegisterAccountForPersonParameters) {
          const accountId = yield* idGenerator.accountId
          const workspaceId = yield* idGenerator.workspaceId
          const workspaceMembershipId = yield* idGenerator.workspaceMembershipId

          /*
           * Special suffix is intended to support debugging through the WorkOS console.
           */
          const workosPersonalOrganizationName = `Personal ${workspaceId.slice(-6).toUpperCase()}`

          const { preferredName, fullName, workosName } = yield* derivePersonNamesFromWorkosUser(workosUser)

          const emailAddress = yield* pipe(
            workosUser.email,
            S.decodeEffect(EmailAddress),
            orDieWithUnexpectedError(
              "The `email` on the WorkOS user does not conform to our email address standards"
            )
          )

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
                    externalId: accountId,
                    firstName: workosName.firstName,
                    lastName: workosName.lastName
                  }
                ),
                orDieWithUnexpectedError("Failed to update WorkOS user during registration.")
              )
            ],
            { concurrency: "unbounded" }
          )

          /*
           * If there is any failure, attempt to clean up the dangling organization
           */
          yield* Effect.addFinalizer((exit) => {
            if (Exit.isFailure(exit)) {
              return pipe(
                workosGatewayClient.organizations.deleteOrganization(workosOrganization.id),
                Effect.tapCause((cause) => Effect.logWarning("Failed to clean up a WorkOS organization", cause)),
                Effect.ignore
              )
            }

            return Effect.void
          })

          const workosOrganizationMembership = yield* pipe(
            workosGatewayClient.userManagement.createOrganizationMembership({
              userId: workosUser.id,
              organizationId: workosOrganization.id
            }),
            orDieWithUnexpectedError("Failed to create WorkOS organization membership during registration.")
          )

          yield* persistRegistration({
            accountParameters: {
              id: accountId,
              workosUserId: workosUser.id,
              preferredName,
              fullName,
              emailAddress
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
            accountId,
            workspaceId,
            workosOrganizationId: workosOrganization.id
          }
        },
        Effect.scoped
      )

      return { registerAccountForPerson }
    })
  }
) {
  static readonly layer = pipe(
    Layer.effect(this, this.make),
    Layer.provide([
      DomainIdGenerator.layer,
      PersonFallbackNameGenerator.layer,
      AccountsCreationModule.layer,
      WorkspacesCreationModule.layer
    ])
  )
}
