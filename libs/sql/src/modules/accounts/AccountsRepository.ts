import type * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import type { AccountId } from "@one-kilo/domain/ids/AccountId"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { MachineClientId } from "@one-kilo/domain/ids/MachineClientId"
import type { PersonId } from "@one-kilo/domain/ids/PersonId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import { AccountsModel } from "./AccountsModel.ts"
import { toAccountEntity } from "./internal/AccountsModelTransformations.ts"

type BaseInsertAccountParameters = {
  id?: AccountId
  performedByAccountId?: AccountId
}
type InsertAccountParameters =
  & BaseInsertAccountParameters
  & ({
    type: "Person"
    personId: PersonId
    workosUserId: WorkOSIds.UserId
    machineClientId?: never
    workosClientId?: never
  } | {
    type: "MachineClient"
    machineClientId: MachineClientId
    workosClientId: WorkOSIds.ApplicationClientId
    personId?: never
    workosUserId?: never
  })

export class AccountsRepository extends Effect.Service<AccountsRepository>()(
  "@one-kilo/sql/AccountsRepository",
  {
    dependencies: [DomainIdGenerator.Default],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      const idGenerator = yield* DomainIdGenerator

      const insertSchema = SqlSchema.single({
        Request: AccountsModel.insert,
        Result: AccountsModel.select,
        execute: (request) => sql`INSERT INTO accounts ${sql.insert(request).returning("*")}`
      })
      const insert = Effect.fn("AccountsRepository.insert")(
        function*({
          type,
          personId,
          workosUserId,
          machineClientId,
          workosClientId,
          id,
          performedByAccountId
        }: InsertAccountParameters) {
          const accountIdEffect = id
            ? Effect.succeed(id)
            : idGenerator.accountId

          return yield* pipe(
            accountIdEffect,
            Effect.flatMap((accountId) =>
              insertSchema({
                id: accountId,
                type,
                personId: personId ?? null,
                workosUserId: workosUserId ?? null,
                machineClientId: machineClientId ?? null,
                workosClientId: workosClientId ?? null,
                createdAt: undefined,
                createdByAccountId: performedByAccountId ?? accountId,
                updatedAt: undefined,
                updatedByAccountId: performedByAccountId ?? accountId,
                archivedAt: undefined
              })
            ),
            Effect.andThen(toAccountEntity)
          )
        },
        orDieWithUnexpectedError("Failed to insert account")
      )

      return { insert }
    })
  }
) {}
