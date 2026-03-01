import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as SimplifiedLatin from "./internal/SimplifiedLatin.ts"

export const MachineClientName = pipe(
  SimplifiedLatin.Name,
  S.maxLength(64),
  S.brand("@one-kilo/domain/MachineClientName"),
  S.annotations({
    description: "The name of a machine client",
    identifier: "MachineClientName",
    title: "Machine Client Name"
  })
)
export type MachineClientName = typeof MachineClientName.Type
