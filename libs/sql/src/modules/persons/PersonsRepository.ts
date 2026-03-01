import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import { PersonEntity } from "@one-kilo/domain/entities/Person"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { PersonId } from "@one-kilo/domain/ids/PersonId"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import type { FullName, PreferredName } from "@one-kilo/domain/values/PersonValues"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { PersonsModel } from "./PersonsModel.ts"

type InsertPersonParameters = {
  preferredName: PreferredName
  fullName: FullName
  performedByUserId: UserId

  id?: PersonId
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

          return PersonEntity.make({
            id: model.id,
            preferredName: model.preferredName,
            fullName: model.fullName,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            archivedAt: model.archivedAt
          })
        },
        orDieWithUnexpectedError("Failed to insert person")
      )

      return { insert }
    })
  }
) {}
