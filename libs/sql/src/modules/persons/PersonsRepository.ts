import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import type { FullName, PreferredName } from "@one-kilo/domain/values/PersonValues"
import { dieWithUnexpectedError, orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as PgClientExtensions from "@one-kilo/sql/utils/PgClientExtensions"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import { toPersonEntity } from "./internal/PersonsModelTransformations.ts"
import { PersonsCreatedByForeignKey, PersonsUpdatedByForeignKey } from "./PersonsForeignKeys.ts"
import { PersonsModel } from "./PersonsModel.ts"

type InsertPersonParameters = {
  preferredName: PreferredName
  fullName: FullName

  performedByUserId: UserId

  id?: PersonId
}

type UpdatePersonParameters = {
  readonly fields: {
    readonly preferredName?: PreferredName
    readonly fullName?: FullName
  }
  readonly performedByUserId: UserId
}

export class PersonsRepository extends Effect.Service<PersonsRepository>()(
  "@one-kilo/sql/PersonsRepository",
  {
    dependencies: [DomainIdGenerator.Default],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      const idGenerator = yield* DomainIdGenerator

      const insertSchema = SqlSchema.single({
        Request: PersonsModel.insert,
        Result: PersonsModel.select,
        execute: (request) => sql`INSERT INTO persons ${sql.insert(request).returning("*")}`
      })
      const insert = Effect.fn("PersonsRepository.insert")(
        function*({
          preferredName,
          fullName,
          performedByUserId,
          id
        }: InsertPersonParameters) {
          const personIdEffect = id
            ? Effect.succeed(id)
            : idGenerator.personId

          const model = yield* Effect.flatMap(
            personIdEffect,
            (personId) =>
              insertSchema({
                id: personId,
                preferredName,
                fullName,
                createdAt: undefined,
                createdByUserId: performedByUserId,
                updatedAt: undefined,
                updatedByUserId: performedByUserId,
                archivedAt: undefined
              })
          )

          return toPersonEntity(model)
        },
        orDieWithUnexpectedError("Failed to insert person")
      )

      const updateSchema = SqlSchema.single({
        Request: PersonsModel.partialUpdate,
        Result: PersonsModel.select,
        execute: ({ id, ...fields }) =>
          sql`
            UPDATE persons
            SET ${sql.update(fields)}
            WHERE id = ${id}
            RETURNING *
          `
      })

      const update = Effect.fn("PersonsRepository.update")(
        function*(personId: PersonId, parameters: UpdatePersonParameters) {
          if (Object.keys(parameters.fields).length === 0) {
            return yield* dieWithUnexpectedError("No fields to update")
          }

          const model = yield* updateSchema({
            id: personId,
            ...parameters.fields,
            updatedAt: undefined,
            updatedByUserId: parameters.performedByUserId
          })

          return toPersonEntity(model)
        },
        orDieWithUnexpectedError("Failed to update person")
      )

      const withDeferredForeignKeyConstraints = pipe(
        sql,
        PgClientExtensions.withDeferredConstraints(
          PersonsCreatedByForeignKey,
          PersonsUpdatedByForeignKey
        )
      )

      return {
        insert,
        update,
        withDeferredForeignKeyConstraints
      }
    })
  }
) {}
