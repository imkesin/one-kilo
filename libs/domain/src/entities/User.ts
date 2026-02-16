import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as S from "effect/Schema"
import { UserId } from "../ids/UserId.ts"
import { EntityAuditFields } from "./EntityFields.ts"

const EntityBaseFields = {
  id: UserId,
  workosUserId: WorkOSIds.UserId,

  ...EntityAuditFields
} as const

export class UserEntity extends S.TaggedClass<UserEntity>("@one-kilo/domain/UserEntity")(
  "UserEntity",
  { ...EntityBaseFields },
  {
    identifier: "UserEntity",
    title: "User Entity",
    description: "A minimal user entity"
  }
) {}

export class User extends S.TaggedClass<User>("@one-kilo/domain/User")(
  "User",
  {
    ...EntityBaseFields
  },
  {
    identifier: "User",
    title: "User",
    description: "A person who can access workspaces and collaborate."
  }
) {}
