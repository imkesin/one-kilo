import { UsersQueryRepository } from "@one-kilo/sql/modules/users/UsersQueryRepository"
import * as Effect from "effect/Effect"

export class UsersQueryModule extends Effect.Service<UsersQueryModule>()(
  "@one-kilo/server/UsersQueryModule",
  {
    dependencies: [UsersQueryRepository.Default],
    effect: Effect.gen(function*() {
      const usersQueryRepository = yield* UsersQueryRepository

      return {
        retrieveUser: usersQueryRepository.findUserByUserId
      }
    })
  }
) {}
