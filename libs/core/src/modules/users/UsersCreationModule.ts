import type * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { UserCreatedAuditLog } from "@one-kilo/domain/audit-logs/UserAuditLogs"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import type { EmailAddress } from "@one-kilo/domain/values/EmailAddressValues"
import type { FullName, PreferredName } from "@one-kilo/domain/values/PersonValues"
import { AuditLogsRepository } from "@one-kilo/sql/modules/audit-logs/AuditLogsRepository"
import { EmailAddressesRepository } from "@one-kilo/sql/modules/email-addresses/EmailAddressesRepository"
import { PersonsRepository } from "@one-kilo/sql/modules/persons/PersonsRepository"
import { UsersRepository } from "@one-kilo/sql/modules/users/UsersRepository"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"

type CreateHumanUserParameters = {
  id: UserId
  preferredName: PreferredName
  fullName: FullName
  emailAddress: EmailAddress
  workosUserId: WorkOSIds.UserId
}

export class UsersCreationModule extends Effect.Service<UsersCreationModule>()(
  "@one-kilo/core/UsersCreationModule",
  {
    dependencies: [
      AuditLogsRepository.Default,
      DomainIdGenerator.Default,
      EmailAddressesRepository.Default,
      PersonsRepository.Default,
      UsersRepository.Default
    ],
    effect: Effect.gen(function*() {
      const auditLogsRepository = yield* AuditLogsRepository
      const emailAddressesRepository = yield* EmailAddressesRepository
      const idGenerator = yield* DomainIdGenerator
      const personsRepository = yield* PersonsRepository
      const usersRepository = yield* UsersRepository

      const recordUserCreated = Effect.fn("UsersCreationModule.recordUserCreated")(
        function*(user: { id: UserId }) {
          const id = yield* idGenerator.auditLogId

          const auditLog = yield* UserCreatedAuditLog.build({
            id,
            performedByUserId: user.id,
            targets: [{ id: user.id, type: "User" as const }]
          })

          yield* auditLogsRepository.insert({
            ...auditLog,
            encodedContext: Option.none()
          })
        }
      )

      const createPersonUser = Effect.fn("UsersCreationModule.createPersonUser")(
        function*({ id, preferredName, fullName, emailAddress, workosUserId }: CreateHumanUserParameters) {
          const person = yield* pipe(
            personsRepository.insert({
              preferredName,
              fullName,
              performedByUserId: id
            }),
            personsRepository.withDeferredForeignKeyConstraints
          )

          const user = yield* usersRepository.insert({
            id,
            type: "Person",
            personId: person.id,
            workosUserId
          })

          yield* Effect.all([
            emailAddressesRepository.insert({
              personId: person.id,
              value: emailAddress,
              performedByUserId: id
            }),
            recordUserCreated(user)
          ], { concurrency: "unbounded" })

          return user
        }
      )

      return { createPersonUser }
    })
  }
) {}
