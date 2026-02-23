import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import { UserId } from "@one-kilo/domain/ids/UserId"
import type { UserType } from "@one-kilo/domain/values/UserValues"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { UsersModel } from "./UsersModel.ts"

type InsertUserParameters = {
  type: UserType
  workosUserId: WorkOSIds.UserId

  id?: UserId
  performedByUserId?: UserId
}

export class UsersRepository extends Effect.Service<UsersRepository>()(
  "@one-kilo/sql/UsersRepository",
  {
    dependencies: [DomainIdGenerator.Default],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      const idGenerator = yield* DomainIdGenerator

      const insertSchema = SqlSchema.single({
        Request: UsersModel.insert,
        Result: UsersModel.select,
        execute: (request) => sql`INSERT INTO users ${sql.insert(request).returning("*")}`
      })
      const insert = Effect.fn("UsersRepository.insert")(
        function*({
          type,
          workosUserId,
          id,
          performedByUserId
        }: InsertUserParameters) {
          const userIdEffect = id
            ? Effect.succeed(id)
            : idGenerator.userId

          return yield* Effect.flatMap(
            userIdEffect,
            (userId) =>
              insertSchema({
                id: userId,
                type,
                workosUserId,
                createdAt: undefined,
                createdByUserId: performedByUserId ?? userId,
                updatedAt: undefined,
                updatedByUserId: performedByUserId ?? userId,
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
