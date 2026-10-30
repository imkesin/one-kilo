import type { PersonEntity } from "@one-kilo/domain/entities/Person"
import type { AccountId } from "@one-kilo/domain/ids/AccountId"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { PersonId } from "@one-kilo/domain/ids/PersonId"
import type { LocalDate } from "@one-kilo/domain/values/LocalDate"
import type { FullName, PreferredName, Sex, Timezone } from "@one-kilo/domain/values/PersonValues"
import { dieWithUnexpectedError, orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as PgClientExtensions from "@one-kilo/sql/utils/PgClientExtensions"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as SqlClient from "effect/sql/SqlClient"
import * as SqlSchemaExtensions from "../../utils/SqlSchemaExtensions.ts"
import { toPersonEntity } from "./internal/PersonsModelTransformations.ts"
import { PersonsCreatedByForeignKey, PersonsUpdatedByForeignKey } from "./PersonsForeignKeys.ts"
import { PersonsModel } from "./PersonsModel.ts"

type InsertPersonParameters = {
  preferredName: PreferredName
  fullName: FullName

  performedByAccountId: AccountId

  id?: PersonId
}

type UpdatePersonParameters = {
  readonly fields: {
    readonly preferredName?: PreferredName
    readonly fullName?: FullName
    readonly sex?: Sex
    readonly dateOfBirth?: LocalDate
    readonly timezone?: Timezone
  }
  readonly performedByAccountId: AccountId
}

export class PersonsRepository extends Context.Service<PersonsRepository>()(
  "@one-kilo/sql/PersonsRepository",
  {
    make: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      const idGenerator = yield* DomainIdGenerator

      const insertSchema = SqlSchemaExtensions.findOneWithRequestDefaults({
        Request: PersonsModel.insert,
        Result: PersonsModel.select,
        execute: (request) => sql`INSERT INTO persons ${sql.insert(request).returning("*")}`
      })
      const insert = Effect.fn("PersonsRepository.insert")(
        function*({
          preferredName,
          fullName,
          performedByAccountId,
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
                sex: null,
                dateOfBirth: null,
                createdAt: undefined,
                createdByAccountId: performedByAccountId,
                updatedAt: undefined,
                updatedByAccountId: performedByAccountId,
                archivedAt: undefined
              })
          )

          return toPersonEntity(model)
        },
        orDieWithUnexpectedError("Failed to insert person")
      )

      const updateSchema = SqlSchemaExtensions.findOneWithRequestDefaults({
        Request: PersonsModel.partialUpdate,
        Result: PersonsModel.select,
        execute: ({ id, version, ...fields }) =>
          sql`
            UPDATE persons
            SET ${sql.update(fields)}, version = version + 1
            WHERE id = ${id} AND version = ${version}
            RETURNING *
          `
      })

      const update = Effect.fn("PersonsRepository.update")(
        function*(person: PersonEntity, parameters: UpdatePersonParameters) {
          if (Object.keys(parameters.fields).length === 0) {
            return yield* dieWithUnexpectedError("No fields to update")
          }

          const model = yield* pipe(
            updateSchema({
              id: person.id,
              version: person.version,
              ...parameters.fields,
              updatedAt: undefined,
              updatedByAccountId: parameters.performedByAccountId
            }),
            /*
             * Under SERIALIZABLE a concurrent write raises a serialization failure instead, so no row
             * means the version that was read is wrong.
             */
            Effect.catchTag("NoSuchElementError", () =>
              dieWithUnexpectedError(
                "The person changed since it was read",
                { person: { id: person.id, version: person.version } }
              ))
          )

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
) {
  static readonly layer = pipe(
    Layer.effect(this, this.make),
    Layer.provide(DomainIdGenerator.layer)
  )
}
