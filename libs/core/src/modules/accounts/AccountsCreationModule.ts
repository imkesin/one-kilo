import type * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { AccountCreatedAuditLog } from "@one-kilo/domain/audit-logs/AccountAuditLogs"
import type { AccountId } from "@one-kilo/domain/ids/AccountId"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { EmailAddress } from "@one-kilo/domain/values/EmailAddressValues"
import type { FullName, PreferredName } from "@one-kilo/domain/values/PersonValues"
import { AccountsRepository } from "@one-kilo/sql/modules/accounts/AccountsRepository"
import { AuditLogsRepository } from "@one-kilo/sql/modules/audit-logs/AuditLogsRepository"
import { EmailAddressesRepository } from "@one-kilo/sql/modules/email-addresses/EmailAddressesRepository"
import { PersonsRepository } from "@one-kilo/sql/modules/persons/PersonsRepository"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"

type CreateAccountForPersonParameters = {
  id: AccountId
  preferredName: PreferredName
  fullName: FullName
  emailAddress: EmailAddress
  workosUserId: WorkOSIds.UserId
}

export class AccountsCreationModule extends Effect.Service<AccountsCreationModule>()(
  "@one-kilo/core/AccountsCreationModule",
  {
    dependencies: [
      AuditLogsRepository.Default,
      DomainIdGenerator.Default,
      EmailAddressesRepository.Default,
      PersonsRepository.Default,
      AccountsRepository.Default
    ],
    effect: Effect.gen(function*() {
      const auditLogsRepository = yield* AuditLogsRepository
      const emailAddressesRepository = yield* EmailAddressesRepository
      const idGenerator = yield* DomainIdGenerator
      const personsRepository = yield* PersonsRepository
      const accountsRepository = yield* AccountsRepository

      const recordAccountCreated = Effect.fn("AccountsCreationModule.recordAccountCreated")(
        function*(account: { id: AccountId }) {
          const id = yield* idGenerator.auditLogId

          const auditLog = yield* AccountCreatedAuditLog.build({
            id,
            performedByAccountId: account.id,
            targets: [{ id: account.id, type: "Account" as const }]
          })

          yield* auditLogsRepository.insert({
            ...auditLog,
            encodedContext: Option.none()
          })
        }
      )

      const createAccountForPerson = Effect.fn("AccountsCreationModule.createAccountForPerson")(
        function*({ id, preferredName, fullName, emailAddress, workosUserId }: CreateAccountForPersonParameters) {
          const person = yield* pipe(
            personsRepository.insert({
              preferredName,
              fullName,
              performedByAccountId: id
            }),
            personsRepository.withDeferredForeignKeyConstraints
          )

          const account = yield* accountsRepository.insert({
            id,
            type: "Person",
            personId: person.id,
            workosUserId
          })

          yield* Effect.all([
            emailAddressesRepository.insert({
              personId: person.id,
              value: emailAddress,
              performedByAccountId: id
            }),
            recordAccountCreated(account)
          ], { concurrency: "unbounded" })

          return account
        }
      )

      return { createAccountForPerson }
    })
  }
) {}
