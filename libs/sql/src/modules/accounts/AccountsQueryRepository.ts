import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import type { Account } from "@one-kilo/domain/entities/Account"
import { AccountId } from "@one-kilo/domain/ids/AccountId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as S from "effect/Schema"
import { EmailAddressesModel } from "../email-addresses/EmailAddressesModel.ts"
import { MachineClientsModel } from "../machine-clients/MachineClientsModel.ts"
import { PersonsModel } from "../persons/PersonsModel.ts"
import { AccountsModel } from "./AccountsModel.ts"
import { toAccount } from "./internal/AccountsModelTransformations.ts"

type FindAccountByAccountIdParameters = {
  accountId: AccountId
}

export class AccountsQueryRepository extends Effect.Service<AccountsQueryRepository>()(
  "@one-kilo/sql/AccountsQueryRepository",
  {
    dependencies: [],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient

      const findAccountByAccountIdSchema = SqlSchema.findOne({
        Request: AccountId,
        Result: S.extend(
          AccountsModel.select,
          S.Struct({
            person: pipe(
              S.extend(
                PersonsModel.select,
                S.Struct({ emailAddresses: S.Array(EmailAddressesModel.select) })
              ),
              S.NullOr
            ),
            machineClient: pipe(
              MachineClientsModel.select,
              S.NullOr
            )
          })
        ),
        execute: (accountId) =>
          sql`
            SELECT
              accounts.*,
              CASE
                WHEN accounts.type = 'MachineClient'
                THEN ${sql.unsafe(MachineClientsModel.asJsonBBuildObject())}
              END AS machine_client,
              CASE
                WHEN accounts.type = 'Person'
                THEN ${sql.unsafe(PersonsModel.asJsonBBuildObjectWithRelations())}
              END AS person
            FROM accounts
            LEFT JOIN machine_clients
              ON machine_clients.id = accounts.machine_client_id
              AND machine_clients.archived_at IS NULL
            LEFT JOIN persons
              ON persons.id = accounts.person_id
              AND persons.archived_at IS NULL
            WHERE
              accounts.id = ${accountId}
              AND accounts.archived_at IS NULL
            LIMIT 1
          `
      })
      const findAccountByAccountId = Effect.fn("AccountsQueryRepository.findAccountByAccountId")(
        function*({ accountId }: FindAccountByAccountIdParameters) {
          const maybeAccountModel = yield* findAccountByAccountIdSchema(accountId)

          if (Option.isNone(maybeAccountModel)) {
            return Option.none<Account>()
          }

          return yield* Effect.map(
            toAccount(maybeAccountModel.value),
            Option.some
          )
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding an account")
      )

      return {
        findAccountByAccountId
      }
    })
  }
) {}
