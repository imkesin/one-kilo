import * as UUIDv7 from "@one-kilo/lib/uuid/UUIDv7"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { makeIdFromPrefixed } from "./internal/makeIdFromPrefixed.js"

export const MachineClientId = pipe(
  UUIDv7.UUIDv7,
  S.brand("@one-kilo/domain/MachineClientId"),
  S.annotations({
    description: "The unique identifier for a machine client",
    identifier: "MachineClientId",
    title: "Machine Client ID"
  })
)
export type MachineClientId = typeof MachineClientId.Type

const MACHINE_CLIENT_PREFIX = "mcli_"

export const PrefixedMachineClientId = pipe(
  S.NonEmptyTrimmedString,
  S.startsWith(MACHINE_CLIENT_PREFIX),
  S.brand("@one-kilo/domain/PrefixedMachineClientId"),
  S.annotations({
    description: "The unique identifier for a machine client.",
    identifier: "PrefixedMachineClientId",
    title: "Machine Client ID (Prefixed)"
  })
)
export type PrefixedMachineClientId = typeof PrefixedMachineClientId.Type

export const MachineClientIdFromPrefixed = makeIdFromPrefixed(
  PrefixedMachineClientId,
  MachineClientId,
  {
    prefix: MACHINE_CLIENT_PREFIX,
    makeId: MachineClientId.make,
    makePrefixed: PrefixedMachineClientId.make
  }
)
