import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as SimplifiedLatin from "./internal/SimplifiedLatin.ts"

export const MachineName = pipe(
  SimplifiedLatin.Name,
  S.maxLength(64),
  S.brand("@one-kilo/domain/MachineName"),
  S.annotations({
    description: "The name of a machine",
    identifier: "MachineName",
    title: "Machine Name"
  })
)
export type MachineName = typeof MachineName.Type
