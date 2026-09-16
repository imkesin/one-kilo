import * as S from "effect/Schema"
import { AccountId } from "../ids/AccountId.ts"
import { MachineClientId } from "../ids/MachineClientId.ts"
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
    accountId: AccountId
  },
  {
    identifier: "MachineClientEntity",
    title: "Machine Client Entity",
    description: "A minimal machine client entity"
  }
) {}

export class MachineClientOnAccount
  extends S.TaggedClass<MachineClientOnAccount>("@one-kilo/domain/MachineClientOnAccount")(
    "MachineClientOnAccount",
    {
      ...EntityBaseFields
    },
    {
      identifier: "MachineClientOnAccount",
      title: "Machine Client (on Account)",
      description: "A machine client linked to an account"
    }
  )
{}
