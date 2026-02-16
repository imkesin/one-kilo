import * as WorkOSApiGateway from "@effect/auth-workos/ApiGateway"
import * as WorkOSEntities from "@effect/auth-workos/domain/Entities"
import * as Effect from "effect/Effect"

type RegisterHumanUserParameters = {
  readonly workosUser: WorkOSEntities.User
}

export class RegistrationProcesses extends Effect.Service<RegistrationProcesses>()(
  "@one-kilo/server/RegistrationProcesses",
  {
    dependencies: [],
    effect: Effect.gen(function*() {
      const { client: _workosClient } = yield* WorkOSApiGateway.ApiGateway

      const registerHumanUser = Effect.fn("RegistrationProcesses.registerHumanUser")(
        function*({ workosUser: _workosUser }: RegisterHumanUserParameters) {
          /*
            1. Create WorkOS organization          ← external, first
            2. Create WorkOS org membership        ← external, second
            3. DB transaction:                     ← all internal, atomic
                - insert user
                - insert workspace (using WorkOS org ID)
                - insert workspace membership
           */
        }
      )

      return { registerHumanUser }
    })
  }
) {}
