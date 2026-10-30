import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { AggregateVersion } from "./internal/AggregateVersion.ts"

export const MachineClientVersion = pipe(
  AggregateVersion,
  S.brand("@one-kilo/domain/MachineClientVersion"),
  S.annotate({
    description: "The version of a machine client, incremented with every committed change.",
    identifier: "MachineClientVersion",
    title: "Machine Client Version"
  })
)
export type MachineClientVersion = typeof MachineClientVersion.Type
