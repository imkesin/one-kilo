import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import { UsersRepository } from "@one-kilo/sql/modules/users/UsersRepository"
import * as Effect from "effect/Effect"

type CreateHumanUserParameters = {
  id: UserId
  workosUserId: WorkOSIds.UserId
}

export class UsersCreationModule extends Effect.Service<UsersCreationModule>()(
  "@one-kilo/server/UsersCreationModule",
  {
    dependencies: [UsersRepository.Default],
    effect: Effect.gen(function*() {
      const usersRepository = yield* UsersRepository

      const createHumanUser = Effect.fn("UsersCreationModule.createHumanUser")(
        function*({ id, workosUserId }: CreateHumanUserParameters) {
          const user = yield* usersRepository.insert({
            id,
            workosUserId
          })

          // This user needs to have a name, email address

          // Record creation event

          return user
        }
      )

      return { createHumanUser }
    })
  }
) {}
