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

export class Api_MachineClientAccount extends S.TaggedClass<Api_MachineClientAccount>(
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
  static fromDomain = (account: MachineClientAccount) => Api_MachineClientAccount.make(account)
}

const Api_PersonOnAccount = S.Struct({
  id: PersonIdFromPrefixed,
  preferredName: PreferredName,
  fullName: FullName,
  emailAddresses: S.NonEmptyArray(Api_EmailAddressOnPerson),

  ...ApiAuditFields
})

export class Api_PersonAccount extends S.TaggedClass<Api_PersonAccount>(
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
  static fromDomain = (account: PersonAccount) => Api_PersonAccount.make(account)
}

export const Api_Account = S.Union(
  Api_PersonAccount,
  Api_MachineClientAccount
)
export type Api_Account = typeof Api_Account.Type

export const toApi_Account = (account: Account): Api_Account =>
  Match.valueTags(
    account,
    {
      "Account:MachineClient": Api_MachineClientAccount.fromDomain,
      "Account:Person": Api_PersonAccount.fromDomain
    }
  )
