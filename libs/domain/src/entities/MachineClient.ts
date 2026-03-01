import * as S from "effect/Schema"
import { MachineClientId } from "../ids/MachineClientId.ts"
import { UserId } from "../ids/UserId.ts"
import { MachineClientName } from "../values/MachineClientValues.ts"
import { EntityAuditFields } from "./internal/EntityFields.ts"

const EntityBaseFields = {
  id: MachineClientId,

  name: MachineClientName,

  ...EntityAuditFields
} as const

export class MachineClientEntity extends S.TaggedClass<MachineClientEntity>("@one-kilo/domain/MachineClientEntity")(
  "MachineClientEntity",
  {
    ...EntityBaseFields,
    userId: UserId
  },
  {
    identifier: "MachineClientEntity",
    title: "Machine Client Entity",
    description: "A minimal machine client entity"
  }
) {}

export class MachineClientOnUser extends S.TaggedClass<MachineClientOnUser>("@one-kilo/domain/MachineClientOnUser")(
  "MachineClientOnUser",
  {
    ...EntityBaseFields
  },
  {
    identifier: "MachineClientOnUser",
    title: "Machine Client (on User)",
    description: "A machine client linked to a user"
  }
) {}
