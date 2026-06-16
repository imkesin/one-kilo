import * as UUIDGenerator from "@one-kilo/lib/uuid/UUIDGenerator"
import * as Effect from "effect/Effect"
import { AthleteId } from "./AthleteId.js"
import { AuditLogId } from "./AuditLogId.js"
import { CoachId } from "./CoachId.js"
import { CoachingRelationshipId } from "./CoachingRelationshipId.js"
import { EmailAddressId } from "./EmailAddressId.js"
import { MachineClientId } from "./MachineClientId.js"
import { PersonId } from "./PersonId.js"
import { UserId } from "./UserId.js"
import { WorkflowSuspensionId } from "./WorkflowSuspensionId.js"
import { WorkspaceId } from "./WorkspaceId.js"
import { WorkspaceMembershipId } from "./WorkspaceMembershipId.js"

export class DomainIdGenerator extends Effect.Service<DomainIdGenerator>()(
  "@one-kilo/domain/DomainIdGenerator",
  {
    dependencies: [UUIDGenerator.UUIDGenerator.Default],
    effect: Effect.gen(function*() {
      const uuidGenerator = yield* UUIDGenerator.UUIDGenerator
      return {
        athleteId: Effect.map(uuidGenerator.v7, AthleteId.make),
        auditLogId: Effect.map(uuidGenerator.v7, AuditLogId.make),
        coachId: Effect.map(uuidGenerator.v7, CoachId.make),
        coachingRelationshipId: Effect.map(uuidGenerator.v7, CoachingRelationshipId.make),
        emailAddressId: Effect.map(uuidGenerator.v7, EmailAddressId.make),
        machineClientId: Effect.map(uuidGenerator.v7, MachineClientId.make),
        personId: Effect.map(uuidGenerator.v7, PersonId.make),
        userId: Effect.map(uuidGenerator.v7, UserId.make),
        workflowSuspensionId: Effect.map(uuidGenerator.v7, WorkflowSuspensionId.make),
        workspaceId: Effect.map(uuidGenerator.v7, WorkspaceId.make),
        workspaceMembershipId: Effect.map(uuidGenerator.v7, WorkspaceMembershipId.make)
      }
    })
  }
) {}
