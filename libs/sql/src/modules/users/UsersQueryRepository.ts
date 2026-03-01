import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import type { UserEntity } from "@one-kilo/domain/entities/User"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import { toUserEntity } from "./internal/UsersModelTransformations.ts"
import { UsersModel } from "./UsersModel.ts"

type FindUserEntityByWorkOSUserIdParameters = {
  workosUserId: WorkOSIds.UserId
}

export class UsersQueryRepository extends Effect.Service<UsersQueryRepository>()(
  "@one-kilo/sql/UsersQueryRepository",
  {
    dependencies: [],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient

      const findUserEntityByWorkOSUserIdSchema = SqlSchema.findOne({
        Request: WorkOSIds.UserId,
        Result: UsersModel.select,
        execute: (workosUserId) => sql`SELECT * FROM users WHERE workos_user_id = ${workosUserId}`
      })
      const findUserEntityByWorkOSUserId = Effect.fn("UsersQueryRepository.findUserEntityByWorkOSUserId")(
        function*({ workosUserId }: FindUserEntityByWorkOSUserIdParameters) {
          const maybeUserModel = yield* findUserEntityByWorkOSUserIdSchema(workosUserId)

          if (Option.isNone(maybeUserModel)) {
            return Option.none<UserEntity>()
          }

          return yield* Effect.map(
            toUserEntity(maybeUserModel.value),
            Option.some
          )
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding a user entity")
      )

      return { findUserEntityByWorkOSUserId }
    })
  }
) {}
