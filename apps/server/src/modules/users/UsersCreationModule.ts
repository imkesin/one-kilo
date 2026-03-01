import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import { FullName, PreferredName } from "@one-kilo/domain/values/PersonValues"
import { PersonsRepository } from "@one-kilo/sql/modules/persons/PersonsRepository"
import { UsersRepository } from "@one-kilo/sql/modules/users/UsersRepository"
import * as Effect from "effect/Effect"

type CreateHumanUserParameters = {
  id: UserId
  workosUserId: WorkOSIds.UserId
}

export class UsersCreationModule extends Effect.Service<UsersCreationModule>()(
  "@one-kilo/server/UsersCreationModule",
  {
    dependencies: [
      PersonsRepository.Default,
      UsersRepository.Default
    ],
    effect: Effect.gen(function*() {
      const personsRepository = yield* PersonsRepository
      const usersRepository = yield* UsersRepository

      const createPersonUser = Effect.fn("UsersCreationModule.createPersonUser")(
        function*({ id, workosUserId }: CreateHumanUserParameters) {
          const preferredName = PreferredName.make("Anonymous")
          const fullName = FullName.make("Anonymous Shy Unicorn")

          const person = yield* personsRepository.insert({
            preferredName,
            fullName,
            performedByUserId: id
          })

          const user = yield* usersRepository.insert({
            id,
            type: "PERSON",
            personId: person.id,
            workosUserId
          })

          // TODO: Record creation event

          return user
        }
      )

      return { createPersonUser }
    })
  }
) {}
