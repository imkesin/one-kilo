import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import type { Account, MachineClientAccount, PersonAccount } from "@one-kilo/domain/entities/Account"
import { AccountIdFromPrefixed } from "@one-kilo/domain/ids/AccountId"
import { MachineClientIdFromPrefixed } from "@one-kilo/domain/ids/MachineClientId"
import { PersonIdFromPrefixed } from "@one-kilo/domain/ids/PersonId"
import { AccountType } from "@one-kilo/domain/values/AccountValues"
import { MachineClientName } from "@one-kilo/domain/values/MachineClientValues"
import { FullName, PreferredName } from "@one-kilo/domain/values/PersonValues"
import { pipe } from "effect/Function"
import * as Match from "effect/Match"
import * as S from "effect/Schema"
import { ApiAuditFields } from "../../internal/ApiFields.ts"
import { Api_EmailAddressOnPerson } from "../email-addresses/EmailAddressesApiSchemas.ts"

const Api_MachineClientOnAccount = S.Struct({
  id: MachineClientIdFromPrefixed,
  name: MachineClientName,

  ...ApiAuditFields
})

class AccountsApi_MachineClientAccount extends S.TaggedClass<AccountsApi_MachineClientAccount>(
  "@one-kilo/server-api/Account:MachineClient"
)(
  "Account:MachineClient",
  {
    id: AccountIdFromPrefixed,
    type: pipe(
      AccountType,
      S.pickLiteral("MachineClient")
    ),
    machineClient: Api_MachineClientOnAccount,

    ...ApiAuditFields
  }
) {
  static fromDomain = (account: MachineClientAccount) => AccountsApi_MachineClientAccount.make(account)
}

const Api_PersonOnAccount = S.Struct({
  id: PersonIdFromPrefixed,
  preferredName: PreferredName,
  fullName: FullName,
  emailAddresses: S.NonEmptyArray(Api_EmailAddressOnPerson),

  ...ApiAuditFields
})

class AccountsApi_PersonAccount extends S.TaggedClass<AccountsApi_PersonAccount>(
  "@one-kilo/server-api/Account:Person"
)(
  "Account:Person",
  {
    id: AccountIdFromPrefixed,
    type: pipe(
      AccountType,
      S.pickLiteral("Person")
    ),
    person: Api_PersonOnAccount,

    ...ApiAuditFields
  }
) {
  static fromDomain = (account: PersonAccount) => AccountsApi_PersonAccount.make(account)
}

const AccountsApi_Account = S.Union(
  AccountsApi_PersonAccount,
  AccountsApi_MachineClientAccount
)

class AccountsApi_Me_Success extends S.TaggedClass<AccountsApi_Me_Success>("@one-kilo/server-api/Me:Success")(
  "Me:Success",
  {
    account: AccountsApi_Account
  },
  HttpApiSchema.annotations({ status: 200 })
) {
  static fromDomain = (account: Account) =>
    AccountsApi_Me_Success.make({
      account: Match.valueTags(
        account,
        {
          "Account:MachineClient": (account) => AccountsApi_MachineClientAccount.fromDomain(account),
          "Account:Person": (account) => AccountsApi_PersonAccount.fromDomain(account)
        }
      )
    })
}

export const AccountsApi_MeSchemas = {
  Success: AccountsApi_Me_Success
} as const
