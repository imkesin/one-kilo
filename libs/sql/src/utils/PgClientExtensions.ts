import type * as PgClient from "@effect/sql-pg/PgClient"
import { dieWithUnexpectedErrorCallback } from "@one-kilo/lib/errors/UnexpectedError"
import type * as Arr from "effect/Array"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as Schedule from "effect/Schedule"
import type * as SqlClient from "effect/sql/SqlClient"
import * as SqlError from "effect/sql/SqlError"

const isSerializationFailure = (error: unknown) =>
  SqlError.isSqlError(error) && error.reason._tag === "SerializationError"

export const withDeferredConstraints =
  (...constraints: Arr.NonEmptyArray<string>) =>
  (sql: SqlClient.SqlClient) =>
  <A, E, R>(self: Effect.Effect<A, E, R>) =>
    pipe(
      sql`SET CONSTRAINTS ${sql.unsafe(constraints.join(", "))} DEFERRED`,
      Effect.catchTag(
        "SqlError",
        dieWithUnexpectedErrorCallback("Failed to mark constraints as deferred")
      ),
      Effect.andThen(self)
    )

export const withSerializableTransaction = (pg: PgClient.PgClient) => <A, E, R>(self: Effect.Effect<A, E, R>) => {
  const serializableTransaction = pipe(
    pg`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;`,
    Effect.andThen(self),
    pg.withTransaction
  )

  const retriedTransaction = pipe(
    Effect.retry(
      serializableTransaction,
      {
        while: isSerializationFailure,
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

  return pipe(
    Effect.serviceOption(pg.transactionService),
    Effect.flatMap(
      Option.match({
        onNone: () => retriedTransaction,
        /*
         * Already in a transaction; join it directly
         */
        onSome: () => self
      })
    )
  )
}
