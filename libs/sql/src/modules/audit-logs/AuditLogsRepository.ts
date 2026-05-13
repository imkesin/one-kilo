import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import type * as AuditLogDefinitions from "@one-kilo/domain/audit-logs/AuditLogDefinitions"
import type { AuditLogId } from "@one-kilo/domain/ids/AuditLogId"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import type { UserId } from "@one-kilo/domain/ids/UserId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import type * as Brand from "effect/Brand"
import type * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import { AuditLogsModel } from "./AuditLogsModel.ts"
import { toAuditLog } from "./internal/AuditLogsModelTransformations.ts"

type InsertAuditLogParameters = {
  readonly performedByUserId: UserId
  readonly encodedContext: Option.Option<string>
  readonly targets: readonly [
    AuditLogDefinitions.AuditLogTarget,
    ...ReadonlyArray<AuditLogDefinitions.AuditLogTarget>
  ]
  readonly traceId: string
  readonly type: AuditLogDefinitions.AuditLogType
  readonly version: 1 | 2 | 3

  readonly id?: AuditLogId
  readonly timestamp?: DateTime.Utc
}

export class AuditLogsRepository extends Effect.Service<AuditLogsRepository>()(
  "@one-kilo/sql/AuditLogsRepository",
  {
    dependencies: [DomainIdGenerator.Default],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      const idGenerator = yield* DomainIdGenerator

      const insertSchema = SqlSchema.single({
        Request: AuditLogsModel.insert,
        Result: AuditLogsModel.select,
        execute: (request) => sql`INSERT INTO audit_logs ${sql.insert(request).returning("*")}`
      })
      const insert = Effect.fn("AuditLogsRepository.insert")(
        function*({
          performedByUserId,
          encodedContext,
          targets,
          traceId,
          type,
          version,

          id,
          timestamp
        }: InsertAuditLogParameters) {
          const auditLogIdEffect = id
            ? Effect.succeed(id)
            : idGenerator.auditLogId

          return yield* pipe(
            Effect.flatMap(
              auditLogIdEffect,
              (auditLogId) =>
                insertSchema({
                  id: auditLogId,
                  performedByUserId,
                  context: Option.getOrNull(encodedContext),
                  targets,
                  /*
                   * The model is set up to record `DateTimeInsert`, which requires an explicit override.
                   */
                  timestamp: (timestamp as (typeof timestamp & Brand.Brand<"Override">)) ?? undefined,
                  traceId,
                  type,
                  version
                })
            ),
            Effect.andThen(toAuditLog)
          )
        },
        orDieWithUnexpectedError("Failed to insert audit log")
      )

      return { insert }
    })
  }
) {}
