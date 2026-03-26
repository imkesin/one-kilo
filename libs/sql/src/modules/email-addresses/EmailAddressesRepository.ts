import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import { EmailAddressEntity } from "@one-kilo/domain/entities/EmailAddress"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { PersonId } from "@one-kilo/domain/ids/PersonId"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import type { EmailAddress } from "@one-kilo/domain/values/EmailAddressValues"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { EmailAddressesModel } from "./EmailAddressesModel.ts"

type InsertEmailAddressParameters = {
  personId: PersonId
  value: EmailAddress
  performedByUserId: UserId
}

export class EmailAddressesRepository extends Effect.Service<EmailAddressesRepository>()(
  "@one-kilo/sql/EmailAddressesRepository",
  {
    dependencies: [DomainIdGenerator.Default],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      const idGenerator = yield* DomainIdGenerator

      const insertSchema = SqlSchema.single({
        Request: EmailAddressesModel.insert,
        Result: EmailAddressesModel.select,
        execute: (request) => sql`INSERT INTO email_addresses ${sql.insert(request).returning("*")}`
      })

      const insert = Effect.fn("EmailAddressesRepository.insert")(
        function*({
          personId,
          value,
          performedByUserId
        }: InsertEmailAddressParameters) {
          const emailAddressId = yield* idGenerator.emailAddressId

          const model = yield* insertSchema({
            id: emailAddressId,
            personId,
            value,
            createdAt: undefined,
            createdByUserId: performedByUserId,
            updatedAt: undefined,
            updatedByUserId: performedByUserId,
            archivedAt: undefined
          })

          return EmailAddressEntity.make({
            id: model.id,
            personId: model.personId,
            value: model.value,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            archivedAt: model.archivedAt
          })
        },
        orDieWithUnexpectedError("Failed to insert email address")
      )

      return { insert }
    })
  }
) {}
