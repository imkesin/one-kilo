import * as PgClient from "@effect/sql-pg/PgClient"
import * as SqlClient from "@effect/sql/SqlClient"
import { dieWithUnexpectedErrorCallback } from "@one-kilo/lib/errors/UnexpectedError"
import type * as Arr from "effect/Array"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Schedule from "effect/Schedule"
import * as S from "effect/Schema"

const PgSerializationError = S.Struct({
  code: S.Literal("40001")
})
const RetryablePgError = S.Union(PgSerializationError)

const SqlErrorWithRetryableCause = S.Struct({
  cause: RetryablePgError
})

export const withDeferredConstraints = (
  ...constraints: Arr.NonEmptyArray<string>
) =>
<A, E, R>(self: Effect.Effect<A, E, R>) =>
  pipe(
    Effect.flatMap(SqlClient.SqlClient, (sql) => sql`SET CONSTRAINTS ${sql.unsafe(constraints.join(", "))} DEFERRED`),
    Effect.catchTag(
      "SqlError",
      dieWithUnexpectedErrorCallback("Failed to mark constraints as deferred")
    ),
    Effect.andThen(self)
  )

export const withSerializableTransaction = (pg: PgClient.PgClient) => <A, E, R>(self: Effect.Effect<A, E, R>) => {
  const transactionEffect = pipe(
    pg`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;`,
    Effect.andThen(self),
    pg.withTransaction
  )

  return pipe(
    Effect.retry(
      transactionEffect,
      {
        while: S.is(SqlErrorWithRetryableCause),
        times: 3,
        schedule: pipe(
          Schedule.exponential(Duration.millis(10)),
          Schedule.jittered
        )
      }
    ),
    Effect.catchTag(
      "SqlError",
      dieWithUnexpectedErrorCallback("Failed to execute a serializable transaction")
    )
  )
}
