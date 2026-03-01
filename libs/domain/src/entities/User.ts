import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { MachineClientId } from "../ids/MachineClientId.ts"
import { PersonId } from "../ids/PersonId.ts"
import { UserId } from "../ids/UserId.ts"
import { UserType } from "../values/UserValues.ts"
import { EntityAuditFields } from "./internal/EntityFields.ts"
import { MachineClientOnUser } from "./MachineClient.ts"
import { PersonOnUser } from "./Person.ts"

const EntityBaseFields = {
  id: UserId,
  ...EntityAuditFields
} as const

const MachineClientUserEntityFields = {
  ...EntityBaseFields,

  type: pipe(UserType, S.pickLiteral("MACHINE_CLIENT")),
  workosClientId: WorkOSIds.ApplicationClientId
} as const

export class MachineClientUserEntity
  extends S.TaggedClass<MachineClientUserEntity>("@one-kilo/domain/UserEntity:MachineClient")(
    "UserEntity:MachineClient",
    {
      ...MachineClientUserEntityFields,
      machineClientId: MachineClientId
    },
    {
      identifier: "UserEntity:MachineClient",
      title: "User Entity (Machine Client)",
      description: "A minimal user representing a machine client"
    }
  )
{}

export class MachineClientUser extends S.TaggedClass<MachineClientUser>("@one-kilo/domain/User:MachineClient")(
  "MachineClientUser",
  {
    ...MachineClientUserEntityFields,
    machineClient: MachineClientOnUser
  },
  {
    identifier: "User:MachineClient",
    title: "User (Machine Client)",
    description: "A minimal user representing a machine client"
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
    ...PersonUserEntityFields,
    personId: PersonId
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

export type UserEntity = MachineClientUserEntity | PersonUserEntity
export type User = MachineClientUser | PersonUser
