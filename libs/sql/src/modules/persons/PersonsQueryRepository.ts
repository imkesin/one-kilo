import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import type { PersonAccountEntity } from "@one-kilo/domain/entities/Account"
import type { PersonEntity } from "@one-kilo/domain/entities/Person"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as S from "effect/Schema"
import { AccountsModel } from "../accounts/AccountsModel.ts"
import { toPersonAccountEntity } from "../accounts/internal/AccountsModelTransformations.ts"
import { EmailAddressesModel } from "../email-addresses/EmailAddressesModel.ts"
import { PersonRow, toPerson, toPersonEntity } from "./internal/PersonsModelTransformations.ts"
import { PersonsModel } from "./PersonsModel.ts"

type FindPersonByIdParameters = {
  readonly personId: PersonId
}

type FindPersonWithAccountParameters = {
  readonly personId: PersonId
}

type PersonWithAccount = {
  readonly person: PersonEntity
  readonly maybeAccount: Option.Option<PersonAccountEntity>
}

export class PersonsQueryRepository extends Effect.Service<PersonsQueryRepository>()(
  "@one-kilo/sql/PersonsQueryRepository",
  {
    dependencies: [],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient

      const findPersonByIdSchema = SqlSchema.findOne({
        Request: PersonId,
        Result: PersonRow,
        execute: (personId) =>
          sql`
            SELECT
              persons.*,
              ${sql.unsafe(EmailAddressesModel.asJsonBAggForPerson())} AS "emailAddresses"
            FROM persons
            WHERE
              persons.id = ${personId}
              AND persons.archived_at IS NULL
            LIMIT 1
          `
      })
      const findPersonById = Effect.fn("PersonsQueryRepository.findPersonById")(
        function*({ personId }: FindPersonByIdParameters) {
          return yield* Effect.map(
            findPersonByIdSchema(personId),
            Option.map(toPerson)
          )
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding a person")
      )

      const findPersonEntitySchema = SqlSchema.findOne({
        Request: PersonId,
        Result: PersonsModel.select,
        execute: (personId) =>
          sql`
            SELECT *
            FROM persons
            WHERE
              persons.id = ${personId}
              AND persons.archived_at IS NULL
            LIMIT 1
          `
      })
      const findPersonEntity = Effect.fn("PersonsQueryRepository.findPersonEntity")(
        function*({ personId }: FindPersonByIdParameters) {
          return yield* Effect.map(
            findPersonEntitySchema(personId),
            Option.map(toPersonEntity)
          )
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding a person")
      )

      const findPersonEntityWithAccountSchema = SqlSchema.findOne({
        Request: PersonId,
        Result: S.Struct({
          person: PersonsModel.select,
          account: S.NullOr(AccountsModel.select)
        }),
        execute: (personId) =>
          sql`
            SELECT
              ${sql.unsafe(PersonsModel.asJsonBBuildObject())} AS person,
              CASE
                WHEN accounts.id IS NOT NULL THEN ${sql.unsafe(AccountsModel.asJsonBBuildObject())}
              END AS account
            FROM persons
            LEFT JOIN accounts
              ON accounts.person_id = persons.id
              AND accounts.type = 'Person'
              AND accounts.archived_at IS NULL
            WHERE
              persons.id = ${personId}
              AND persons.archived_at IS NULL
            LIMIT 1
          `
      })

      const findPersonEntityWithAccount = Effect.fn("PersonsQueryRepository.findPersonEntityWithAccount")(
        function*({ personId }: FindPersonWithAccountParameters) {
          const maybeRow = yield* findPersonEntityWithAccountSchema(personId)

          if (Option.isNone(maybeRow)) {
            return Option.none<PersonWithAccount>()
          }

          const row = maybeRow.value

          const person = toPersonEntity(row.person)
          const account = yield* pipe(
            Option.fromNullable(row.account),
            Option.match({
              onNone: () => Effect.succeed(Option.none<PersonAccountEntity>()),
              onSome: (_) =>
                Effect.map(
                  toPersonAccountEntity(_),
                  Option.some
                )
            })
          )

          return Option.some({ person, maybeAccount: account })
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding a person with attached account")
      )

      return {
        findPersonById,
        findPersonEntity,
        findPersonEntityWithAccount
      }
    })
  }
) {}
