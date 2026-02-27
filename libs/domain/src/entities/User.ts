import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { UserId } from "../ids/UserId.ts"
import { UserType } from "../values/UserValues.ts"
import { EntityAuditFields } from "./internal/EntityFields.ts"
import { MachineOnUser } from "./Machine.ts"
import { PersonOnUser } from "./Person.ts"

const EntityBaseFields = {
  id: UserId,
  ...EntityAuditFields
} as const

const MachineUserEntityFields = {
  ...EntityBaseFields,

  type: pipe(UserType, S.pickLiteral("MACHINE")),
  workosClientId: WorkOSIds.ApplicationClientId
} as const

export class MachineUserEntity extends S.TaggedClass<MachineUserEntity>("@one-kilo/domain/UserEntity:Machine")(
  "UserEntity:Machine",
  {
    ...MachineUserEntityFields
  },
  {
    identifier: "UserEntity:Machine",
    title: "User Entity (Machine)",
    description: "A minimal user representing a machine"
  }
) {}

export class MachineUser extends S.TaggedClass<MachineUser>("@one-kilo/domain/User:Machine")(
  "MachineUser",
  {
    ...MachineUserEntityFields,
    machine: MachineOnUser
  },
  {
    identifier: "User:Machine",
    title: "User (Machine)",
    description: "A minimal user representing a machine"
  }
) {}

const PersonUserEntityFields = {
  ...EntityBaseFields,

  type: pipe(UserType, S.pickLiteral("PERSON")),
  workosUserId: WorkOSIds.UserId
} as const

export class PersonUserEntity extends S.TaggedClass<PersonUserEntity>("@one-kilo/domain/UserEntity:Person")(
  "UserEntity:Person",
  {
    ...PersonUserEntityFields
  },
  {
    identifier: "UserEntity:Person",
    title: "User Entity (Person)",
    description: "A minimal user representing a person"
  }
) {}

export class PersonUser extends S.TaggedClass<PersonUser>("@one-kilo/domain/User:Person")(
  "PersonUser",
  {
    ...PersonUserEntityFields,
    person: PersonOnUser
  },
  {
    identifier: "User:Person",
    title: "User (Person)",
    description: "A user representing a person"
  }
) {}

export type UserEntity = MachineUserEntity | PersonUserEntity
export type User = MachineUser | PersonUser
