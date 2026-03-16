import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import type * as ActivityLogDefinitions from "@one-kilo/domain/activity-logs/ActivityLogDefinitions"
import { ActivityLogId } from "@one-kilo/domain/ids/ActivityLogId"
import { DomainIdGenerator } from "@one-kilo/domain/ids/DomainIdGenerator"
import { UserId } from "@one-kilo/domain/ids/UserId"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import type * as Brand from "effect/Brand"
import type * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import { ActivityLogsModel } from "./ActivityLogsModel.ts"
import { toActivityLog } from "./internal/ActivityLogsModelTransformations.ts"

type InsertActivityLogParameters = {
  readonly actorId: UserId
  readonly encodedContext: Option.Option<string>
  readonly targets: readonly [
    ActivityLogDefinitions.ActivityLogTarget,
    ...ReadonlyArray<ActivityLogDefinitions.ActivityLogTarget>
  ]
  readonly traceId: string
  readonly type: ActivityLogDefinitions.ActivityLogType
  readonly version: 1 | 2 | 3

  readonly id?: ActivityLogId
  readonly timestamp?: DateTime.Utc
}

export class ActivityLogsRepository extends Effect.Service<ActivityLogsRepository>()(
  "@one-kilo/sql/ActivityLogsRepository",
  {
    dependencies: [DomainIdGenerator.Default],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      const idGenerator = yield* DomainIdGenerator

      const insertSchema = SqlSchema.single({
        Request: ActivityLogsModel.insert,
        Result: ActivityLogsModel.select,
        execute: (request) => sql`INSERT INTO activity_logs ${sql.insert(request).returning("*")}`
      })
      const insert = Effect.fn("ActivityLogsRepository.insert")(
        function*({
          actorId,
          encodedContext,
          targets,
          traceId,
          type,
          version,

          id,
          timestamp
        }: InsertActivityLogParameters) {
          const activityLogIdEffect = id
            ? Effect.succeed(id)
            : idGenerator.activityLogId

          return yield* pipe(
            Effect.flatMap(
              activityLogIdEffect,
              (activityLogId) =>
                insertSchema({
                  id: activityLogId,
                  actorId,
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
            Effect.andThen(toActivityLog)
          )
        },
        orDieWithUnexpectedError("Failed to insert activity log")
      )

      return { insert }
    })
  }
) {}
