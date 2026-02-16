import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import { UserEntity } from "@one-kilo/domain/entities/User"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
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
          return yield* Effect.map(
            findUserEntityByWorkOSUserIdSchema(workosUserId),
            Option.map((_) => UserEntity.make(_))
          )
        },
        orDieWithUnexpectedError("Failed to find user")
      )

      return { findUserEntityByWorkOSUserId }
    })
  }
) {}
