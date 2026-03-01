import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { MachineClientId } from "@one-kilo/domain/ids/MachineClientId"
import type { PersonId } from "@one-kilo/domain/ids/PersonId"
import { UserId } from "@one-kilo/domain/ids/UserId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import { toUserEntity } from "./internal/UsersModelTransformations.ts"
import { UsersModel } from "./UsersModel.ts"

type BaseInsertUserParameters = {
  id?: UserId
  performedByUserId?: UserId
}
type InsertUserParameters =
  & BaseInsertUserParameters
  & ({
    type: "PERSON"
    personId: PersonId
    workosUserId: WorkOSIds.UserId
    machineClientId?: never
    workosClientId?: never
  } | {
    type: "MACHINE_CLIENT"
    machineClientId: MachineClientId
    workosClientId: WorkOSIds.ApplicationClientId
    personId?: never
    workosUserId?: never
  })

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
          personId,
          workosUserId,
          machineClientId,
          workosClientId,
          id,
          performedByUserId
        }: InsertUserParameters) {
          const userIdEffect = id
            ? Effect.succeed(id)
            : idGenerator.userId

          return yield* pipe(
            userIdEffect,
            Effect.flatMap((userId) =>
              insertSchema({
                id: userId,
                type,
                personId: personId ?? null,
                workosUserId: workosUserId ?? null,
                machineClientId: machineClientId ?? null,
                workosClientId: workosClientId ?? null,
                createdAt: undefined,
                createdByUserId: performedByUserId ?? userId,
                updatedAt: undefined,
                updatedByUserId: performedByUserId ?? userId,
                archivedAt: undefined
              })
            ),
            Effect.andThen(toUserEntity)
          )
        },
        orDieWithUnexpectedError("Failed to insert user")
      )

      return { insert }
    })
  }
) {}
