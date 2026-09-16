import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { AccountId } from "../ids/AccountId.ts"
import { MachineClientId } from "../ids/MachineClientId.ts"
import { PersonId } from "../ids/PersonId.ts"
import { AccountType } from "../values/AccountValues.ts"
import { EntityAuditFields } from "./internal/EntityFields.ts"
import { MachineClientOnAccount } from "./MachineClient.ts"
import { PersonOnAccount } from "./Person.ts"

const EntityBaseFields = {
  id: AccountId,
  ...EntityAuditFields
} as const

const MachineClientAccountEntityFields = {
  ...EntityBaseFields,

  type: pipe(AccountType, S.pickLiteral("MachineClient")),
  workosClientId: WorkOSIds.ApplicationClientId
} as const

export class MachineClientAccountEntity
  extends S.TaggedClass<MachineClientAccountEntity>("@one-kilo/domain/AccountEntity:MachineClient")(
    "AccountEntity:MachineClient",
    {
      ...MachineClientAccountEntityFields,
      machineClientId: MachineClientId
    },
    {
      identifier: "AccountEntity:MachineClient",
      title: "Account Entity (Machine Client)",
      description: "A minimal account representing a machine client"
    }
  )
{}

export class MachineClientAccount extends S.TaggedClass<MachineClientAccount>("@one-kilo/domain/Account:MachineClient")(
  "Account:MachineClient",
  {
    ...MachineClientAccountEntityFields,
    machineClient: MachineClientOnAccount
  },
  {
    identifier: "Account:MachineClient",
    title: "Account (Machine Client)",
    description: "A minimal account representing a machine client"
  }
) {}

const PersonAccountEntityFields = {
  ...EntityBaseFields,

  type: pipe(AccountType, S.pickLiteral("Person")),
  workosUserId: WorkOSIds.UserId
} as const

export class PersonAccountEntity extends S.TaggedClass<PersonAccountEntity>("@one-kilo/domain/AccountEntity:Person")(
  "AccountEntity:Person",
  {
    ...PersonAccountEntityFields,
    personId: PersonId
  },
  {
    identifier: "AccountEntity:Person",
    title: "Account Entity (Person)",
    description: "A minimal account representing a person"
  }
) {}

export class PersonAccount extends S.TaggedClass<PersonAccount>("@one-kilo/domain/Account:Person")(
  "Account:Person",
  {
    ...PersonAccountEntityFields,
    person: PersonOnAccount
  },
  {
    identifier: "Account:Person",
    title: "Account (Person)",
    description: "An account representing a person"
  }
) {}

export type AccountEntity = MachineClientAccountEntity | PersonAccountEntity
export type Account = MachineClientAccount | PersonAccount
