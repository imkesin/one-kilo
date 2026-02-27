import * as S from "effect/Schema"
import { MachineId } from "../ids/MachineId.ts"
import { UserId } from "../ids/UserId.ts"
import { MachineName } from "../values/MachineValues.ts"
import { EntityAuditFields } from "./internal/EntityFields.ts"

const EntityBaseFields = {
  id: MachineId,

  name: MachineName,

  ...EntityAuditFields
} as const

export class MachineEntity extends S.TaggedClass<MachineEntity>("@one-kilo/domain/MachineEntity")(
  "MachineEntity",
  {
    ...EntityBaseFields,
    userId: UserId
  },
  {
    identifier: "MachineEntity",
    title: "Machine Entity",
    description: "A minimal machine entity"
  }
) {}

export class MachineOnUser extends S.TaggedClass<MachineOnUser>("@one-kilo/domain/MachineOnUser")(
  "MachineOnUser",
  {
    ...EntityBaseFields
  },
  {
    identifier: "MachineOnUser",
    title: "Machine (on User)",
    description: "A machine linked to a user"
  }
) {}
