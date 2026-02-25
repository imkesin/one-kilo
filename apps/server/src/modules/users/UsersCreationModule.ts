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

      const createPersonUser = Effect.fn("UsersCreationModule.createPersonUser")(
        function*({ id, workosUserId }: CreateHumanUserParameters) {
          // TODO: This user needs to have a name, email address

          const user = yield* usersRepository.insert({
            id,
            type: "PERSON",
            workosUserId
          })

          // Record creation event

          return user
        }
      )

      return { createPersonUser }
    })
  }
) {}
