import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { UserId } from "../ids/UserId.ts"
import { UserType } from "../values/UserValues.ts"
import { EntityAuditFields } from "./EntityFields.ts"

const EntityBaseFields = {
  id: UserId,
  workosUserId: WorkOSIds.UserId,

  ...EntityAuditFields
} as const

const PersonUserEntityFields = {
  ...EntityBaseFields,

  type: pipe(UserType, S.pickLiteral("PERSON"))
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
export type UserEntity = PersonUserEntity

export class PersonUser extends S.TaggedClass<PersonUser>("@one-kilo/domain/User:Person")(
  "PersonUser",
  {
    ...PersonUserEntityFields
  },
  {
    identifier: "User:Person",
    title: "User (Person)",
    description: "A user representing a person"
  }
) {}
