import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { MachineClientId } from "../ids/MachineClientId.ts"
import { PersonId } from "../ids/PersonId.ts"
import { UserId } from "../ids/UserId.ts"
import { WorkspaceId } from "../ids/WorkspaceId.ts"

const PersonActorUser = S.Struct({
  id: UserId,
  type: S.Literal("Person"),
  person: S.Struct({
    id: PersonId
  })
})

const MachineClientActorUser = S.Struct({
  id: UserId,
  type: S.Literal("MachineClient"),
  machineClient: S.Struct({
    id: MachineClientId
  })
})

const ActorIdentityUser = S.Union(PersonActorUser, MachineClientActorUser)

export const ActorIdentity = pipe(
  S.Struct({
    user: ActorIdentityUser,
    workspace: S.Struct({
      id: WorkspaceId
    })
  }),
  S.annotations({
    description: "The identity of the actor performing an action, including user type and workspace scope",
    identifier: "ActorIdentity",
    title: "Actor Identity"
  })
)
export type ActorIdentity = typeof ActorIdentity.Type
