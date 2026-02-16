import * as WorkOSApiGateway from "@effect/auth-workos/ApiGateway"
import * as WorkOSEntities from "@effect/auth-workos/domain/Entities"
import { UserIdGenerator } from "@one-kilo/domain/ids/UserId"
import { WorkspaceIdGenerator } from "@one-kilo/domain/ids/WorkspaceId"
import * as Effect from "effect/Effect"

type RegisterHumanUserParameters = {
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
      const { client: workosClient } = yield* WorkOSApiGateway.ApiGateway

      const userIdGenerator = yield* UserIdGenerator
      const workspaceIdGenerator = yield* WorkspaceIdGenerator

      const registerHumanUser = Effect.fn("RegistrationProcesses.registerHumanUser")(
        function*({ workosUser: _workosUser }: RegisterHumanUserParameters) {
          const _userId = yield* userIdGenerator.generate
          const workspaceId = yield* workspaceIdGenerator.generate

          /*
            1. Create WorkOS organization          ← external, first
            2. Create WorkOS org membership        ← external, second
            3. Refresh WorkOS access token         ← external, third

            4. DB transaction:                     ← all internal, atomic
                - insert user
                - insert workspace (using WorkOS org ID)
                - insert workspace membership
           */

          // Update user to force the `externalId`

          const _workosOrganization = yield* workosClient.organizations.createOrganization({
            name: "TODO",
            externalId: workspaceId
          })
        }
      )

      return { registerHumanUser }
    })
  }
) {}
