import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import type { PersonEntity } from "@one-kilo/domain/entities/Person"
import type { PersonUserEntity } from "@one-kilo/domain/entities/User"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as S from "effect/Schema"
import { EmailAddressesModel } from "../email-addresses/EmailAddressesModel.ts"
import { toPersonUserEntity } from "../users/internal/UsersModelTransformations.ts"
import { UsersModel } from "../users/UsersModel.ts"
import { PersonRow, toPerson, toPersonEntity } from "./internal/PersonsModelTransformations.ts"
import { PersonsModel } from "./PersonsModel.ts"

type FindPersonByIdParameters = {
  readonly personId: PersonId
}

type FindPersonWithUserParameters = {
  readonly personId: PersonId
}

type PersonWithUser = {
  readonly person: PersonEntity
  readonly maybeUser: Option.Option<PersonUserEntity>
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
              p.*,
              ${
            sql.unsafe(EmailAddressesModel.asJsonBAggForPerson({ alias: "ea", personAlias: "p" }))
          } AS "emailAddresses"
            FROM persons p
            WHERE
              p.id = ${personId}
              AND p.archived_at IS NULL
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
            FROM persons p
            WHERE
              p.id = ${personId}
              AND p.archived_at IS NULL
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

      const findPersonEntityWithUserSchema = SqlSchema.findOne({
        Request: PersonId,
        Result: S.Struct({
          person: PersonsModel.select,
          user: S.NullOr(UsersModel.select)
        }),
        execute: (personId) =>
          sql`
            SELECT
              ${sql.unsafe(PersonsModel.asJsonBBuildObject())} AS person,
              CASE
                WHEN u.id IS NOT NULL THEN ${sql.unsafe(UsersModel.asJsonBBuildObject())}
              END AS user
            FROM persons p
            LEFT JOIN users u
              ON u.person_id = p.id
              AND u.type = 'Person'
              AND u.archived_at IS NULL
            WHERE
              p.id = ${personId}
              AND p.archived_at IS NULL
            LIMIT 1
          `
      })

      const findPersonEntityWithUser = Effect.fn("PersonsQueryRepository.findPersonEntityWithUser")(
        function*({ personId }: FindPersonWithUserParameters) {
          const maybeRow = yield* findPersonEntityWithUserSchema(personId)

          if (Option.isNone(maybeRow)) {
            return Option.none<PersonWithUser>()
          }

          const row = maybeRow.value

          const person = toPersonEntity(row.person)
          const user = yield* pipe(
            Option.fromNullable(row.user),
            Option.match({
              onNone: () => Effect.succeed(Option.none<PersonUserEntity>()),
              onSome: (_) =>
                Effect.map(
                  toPersonUserEntity(_),
                  Option.some
                )
            })
          )

          return Option.some({ person, maybeUser: user })
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding a person with attached user")
      )

      return {
        findPersonById,
        findPersonEntity,
        findPersonEntityWithUser
      }
    })
  }
) {}
