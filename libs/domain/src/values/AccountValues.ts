import { pipe } from "effect/Function"
import * as S from "effect/Schema"

export const AccountType = pipe(
  S.Literals(["MachineClient", "Person"]),
  S.annotate({
    description: "The type of account",
    identifier: "AccountType",
    title: "Account Type"
  })
)
export type AccountType = typeof AccountType.Type
