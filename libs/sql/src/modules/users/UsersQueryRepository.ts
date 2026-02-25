import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import { MachineUserEntity, PersonUserEntity, type UserEntity } from "@one-kilo/domain/entities/User"
import { dieWithUnexpectedError, orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
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
          const maybeUserModel = yield* findUserEntityByWorkOSUserIdSchema(workosUserId)

          if (Option.isNone(maybeUserModel)) {
            return Option.none<UserEntity>()
          }

          const model = maybeUserModel.value

          if (model.type === "PERSON" && model.workosUserId) {
            return Option.some(
              PersonUserEntity.make({
                id: model.id,
                type: "PERSON",
                workosUserId: model.workosUserId,
                createdAt: model.createdAt,
                updatedAt: model.updatedAt,
                archivedAt: model.archivedAt
              })
            )
          }

          if (model.type === "MACHINE" && model.workosClientId) {
            return Option.some(
              MachineUserEntity.make({
                id: model.id,
                type: "MACHINE",
                workosClientId: model.workosClientId,
                createdAt: model.createdAt,
                updatedAt: model.updatedAt,
                archivedAt: model.archivedAt
              })
            )
          }

          return yield* dieWithUnexpectedError("User entity found, but could not be converted to a domain entity")
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding a user entity")
      )

      return { findUserEntityByWorkOSUserId }
    })
  }
) {}
