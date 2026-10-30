import { AccountCreatedAuditLog } from "@one-kilo/domain/audit-logs/AccountAuditLogs"
import { AthleteCreatedAuditLog } from "@one-kilo/domain/audit-logs/AthleteAuditLogs"
import type { AuditLog } from "@one-kilo/domain/audit-logs/AuditLogDefinitions"
import { PersonUpdatedAuditLog } from "@one-kilo/domain/audit-logs/PersonAuditLogs"
import { WorkspaceCreatedAuditLog } from "@one-kilo/domain/audit-logs/WorkspaceAuditLogs"
import { WorkspaceMembershipCreatedAuditLog } from "@one-kilo/domain/audit-logs/WorkspaceMembershipAuditLogs"
import { dieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import type { AuditLogsModel } from "../AuditLogsModel.ts"

export const toAuditLog = ({
  id,
  performedByAccountId,
  context,
  targets,
  timestamp,
  traceId,
  type,
  schemaVersion
}: typeof AuditLogsModel.select.Type): Effect.Effect<AuditLog> => {
  if (
    type === "Account.Created"
    && schemaVersion === 1
    && S.is(AccountCreatedAuditLog.fields.targets)(targets)
  ) {
    return Effect.succeed(
      AccountCreatedAuditLog.make({
        id,
        performedByAccountId,
        targets,
        timestamp,
        traceId,
        type: "Account.Created",
        schemaVersion: 1
      })
    )
  }

  if (
    type === "Athlete.Created"
    && schemaVersion === 1
    && S.is(AthleteCreatedAuditLog.fields.targets)(targets)
  ) {
    return Effect.succeed(
      AthleteCreatedAuditLog.make({
        id,
        performedByAccountId,
        targets,
        timestamp,
        traceId,
        type: "Athlete.Created",
        schemaVersion: 1
      })
    )
  }

  if (
    type === "Person.Updated"
    && schemaVersion === 1
    && S.is(PersonUpdatedAuditLog.fields.targets)(targets)
  ) {
    return pipe(
      PersonUpdatedAuditLog.decodeContextUnknown(context),
      Effect.map((decodedContext) =>
        PersonUpdatedAuditLog.make({
          id,
          performedByAccountId,
          context: decodedContext,
          targets,
          timestamp,
          traceId,
          type: "Person.Updated",
          schemaVersion: 1
        })
      ),
      Effect.catchTag("SchemaError", () =>
        dieWithUnexpectedError(
          "Failed to decode `Person.Updated` audit log context",
          { auditLog: { id, type, schemaVersion } }
        ))
    )
  }

  if (
    type === "Workspace.Created"
    && schemaVersion === 1
    && S.is(WorkspaceCreatedAuditLog.fields.targets)(targets)
  ) {
    return Effect.succeed(
      WorkspaceCreatedAuditLog.make({
        id,
        performedByAccountId,
        targets,
        timestamp,
        traceId,
        type: "Workspace.Created",
        schemaVersion: 1
      })
    )
  }

  if (
    type === "WorkspaceMembership.Created"
    && schemaVersion === 1
    && S.is(WorkspaceMembershipCreatedAuditLog.fields.targets)(targets)
  ) {
    return Effect.succeed(
      WorkspaceMembershipCreatedAuditLog.make({
        id,
        performedByAccountId,
        targets,
        timestamp,
        traceId,
        type: "WorkspaceMembership.Created",
        schemaVersion: 1
      })
    )
  }

  return dieWithUnexpectedError(
    "An audit log model could not be converted to a domain entity",
    {
      auditLog: {
        id,
        type,
        schemaVersion
      }
    }
  )
}
