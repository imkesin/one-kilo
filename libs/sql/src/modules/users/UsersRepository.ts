import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import { UserId, UserIdGenerator } from "@one-kilo/domain/ids/UserId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import { UsersModel } from "./UsersModel.ts"

type InsertUserParameters = {
  performedByUserId: Option.Option<UserId>
  workosUserId: WorkOSIds.UserId
}

export class UsersRepository extends Effect.Service<UsersRepository>()(
  "@one-kilo/sql/UsersRepository",
  {
    dependencies: [UserIdGenerator.Default],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      const userIdGenerator = yield* UserIdGenerator

      const insertSchema = SqlSchema.single({
        Request: UsersModel.insert,
        Result: UsersModel.select,
        execute: (request) => sql`INSERT INTO users ${sql.insert(request).returning("*")}`
      })
      const insert = Effect.fn("UsersRepository.insert")(
        function*({ performedByUserId, workosUserId }: InsertUserParameters) {
          return yield* Effect.flatMap(
            userIdGenerator.generate,
            (generatedId) =>
              insertSchema({
                id: generatedId,
                workosUserId,
                createdAt: undefined,
                createdByUserId: Option.getOrNull(performedByUserId) ?? generatedId,
                updatedAt: undefined,
                updatedByUserId: Option.getOrNull(performedByUserId) ?? generatedId,
                archivedAt: undefined
              })
          )
        },
        orDieWithUnexpectedError("Failed to insert user")
      )

      return { insert }
    })
  }
) {}
