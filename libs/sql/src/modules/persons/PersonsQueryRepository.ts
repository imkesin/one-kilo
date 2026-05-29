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
import { toPersonUserEntity } from "../users/internal/UsersModelTransformations.ts"
import { UsersModel } from "../users/UsersModel.ts"
import { toPersonEntity } from "./internal/PersonsModelTransformations.ts"
import { PersonsModel } from "./PersonsModel.ts"

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

      const findPersonWithUserSchema = SqlSchema.findOne({
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

      const findPersonWithUser = Effect.fn("PersonsQueryRepository.findPersonWithUser")(
        function*({ personId }: FindPersonWithUserParameters) {
          const maybeRow = yield* findPersonWithUserSchema(personId)

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

      return { findPersonWithUser }
    })
  }
) {}
