import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makeIdFromPrefixed } from "./internal/makeIdFromPrefixed.js"

export const MachineId = pipe(
  UUIDv7.UUIDv7,
  S.brand("@one-kilo/domain/MachineId"),
  S.annotations({
    description: "The unique identifier for a machine",
    identifier: "MachineId",
    title: "Machine ID"
  })
)
export type MachineId = typeof MachineId.Type

const MACHINE_PREFIX = "mchn_"

export const PrefixedMachineId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith(MACHINE_PREFIX),
  S.brand("@one-kilo/domain/PrefixedMachineId"),
  S.annotations({
    description: "The unique identifier for a machine.",
    identifier: "PrefixedMachineId",
    title: "Machine ID (Prefixed)"
  })
)
export type PrefixedMachineId = typeof PrefixedMachineId.Type

export const MachineIdFromPrefixed = makeIdFromPrefixed(
  PrefixedMachineId,
  MachineId,
  {
    prefix: MACHINE_PREFIX,
    makeId: MachineId.make,
    makePrefixed: PrefixedMachineId.make
  }
)
