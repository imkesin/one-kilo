import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as S from "effect/Schema"
import { UserId } from "../ids/UserId.ts"

export class User extends S.TaggedClass<User>("@one-kilo/domain/User")(
  "User",
  {
    id: UserId,

    workosUserId: WorkOSIds.UserId
  },
  {
    identifier: "User",
    title: "User",
    description: "A person who can access workspaces and collaborate."
  }
) {}
