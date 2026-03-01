import * as UUIDGenerator from "@one-kilo/lib/uuid/UUIDGenerator"
import * as Effect from "effect/Effect"
import { MachineClientId } from "./MachineClientId.js"
import { PersonId } from "./PersonId.js"
import { UserId } from "./UserId.js"
import { WorkspaceId } from "./WorkspaceId.js"
import { WorkspaceMembershipId } from "./WorkspaceMembershipId.js"

export class DomainIdGenerator extends Effect.Service<DomainIdGenerator>()(
  "@one-kilo/domain/DomainIdGenerator",
  {
    dependencies: [UUIDGenerator.UUIDGenerator.Default],
    effect: Effect.gen(function*() {
      const uuidGenerator = yield* UUIDGenerator.UUIDGenerator
      return {
        machineClientId: Effect.map(uuidGenerator.v7, MachineClientId.make),
        personId: Effect.map(uuidGenerator.v7, PersonId.make),
        userId: Effect.map(uuidGenerator.v7, UserId.make),
        workspaceId: Effect.map(uuidGenerator.v7, WorkspaceId.make),
        workspaceMembershipId: Effect.map(uuidGenerator.v7, WorkspaceMembershipId.make)
      }
    })
  }
) {}
