import { pipe } from "effect/Function"
import * as S from "effect/Schema"

export const UserType = pipe(
  S.Literal("MACHINE_CLIENT", "PERSON"),
  S.annotations({
    description: "The type of user",
    identifier: "UserType",
    title: "User Type"
  })
)
export type UserType = typeof UserType.Type
