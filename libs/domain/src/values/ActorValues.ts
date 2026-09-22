import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { AccountId } from "../ids/AccountId.ts"
import { MachineClientId } from "../ids/MachineClientId.ts"
import { PersonId } from "../ids/PersonId.ts"
import { WorkspaceId } from "../ids/WorkspaceId.ts"

const PersonAccountIdentity = S.Struct({
  id: AccountId,
  type: S.Literal("Person"),
  person: S.Struct({
    id: PersonId
  })
})

const MachineClientAccountIdentity = S.Struct({
  id: AccountId,
  type: S.Literal("MachineClient"),
  machineClient: S.Struct({
    id: MachineClientId
  })
})

const ActorAccountIdentity = S.Union(PersonAccountIdentity, MachineClientAccountIdentity)

export const ActorIdentity = pipe(
  S.Struct({
    account: ActorAccountIdentity,
    workspace: S.Struct({
      id: WorkspaceId
    })
  }),
  S.annotations({
    description: "The identity of the actor performing an action, including account type and workspace scope",
    identifier: "ActorIdentity",
    title: "Actor Identity"
  })
)
export type ActorIdentity = typeof ActorIdentity.Type
