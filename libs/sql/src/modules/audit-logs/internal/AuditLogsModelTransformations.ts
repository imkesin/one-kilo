import { AccountCreatedAuditLog } from "@one-kilo/domain/audit-logs/AccountAuditLogs"
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
  version
}: typeof AuditLogsModel.select.Type) => {
  if (
    type === "Account.Created"
    && version === 1
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
        version: 1
      })
    )
  }

  if (
    type === "Person.Updated"
    && version === 1
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
          version: 1
        })
      ),
      Effect.catchTag("ParseError", () =>
        pipe(
          dieWithUnexpectedError("Failed to decode `Person.Updated` audit log context"),
          Effect.annotateLogs({ auditLog: { id, type, version } })
        ))
    )
  }

  if (
    type === "Workspace.Created"
    && version === 1
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
        version: 1
      })
    )
  }

  if (
    type === "WorkspaceMembership.Created"
    && version === 1
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
        version: 1
      })
    )
  }

  return pipe(
    dieWithUnexpectedError("An audit log model could not be converted to a domain entity"),
    Effect.annotateLogs({
      auditLog: {
        id,
        type,
        version
      }
    })
  )
}
