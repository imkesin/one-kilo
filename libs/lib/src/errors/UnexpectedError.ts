import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"

export class UnexpectedError extends S.TaggedError<UnexpectedError>("@one-kilo/lib/UnexpectedError")(
  "UnexpectedError",
  {
    cause: pipe(
      S.Defect,
      S.optional
    ),
    context: pipe(
      S.Record({
        key: S.NonEmptyTrimmedString,
        value: S.Unknown
      }),
      S.optional
    ),
    message: S.NonEmptyTrimmedString
  },
  {
    description: "An unexpected error occurred."
  }
) {}

type UnexpectedErrorContext = typeof UnexpectedError.Type["context"]

/*
 * Annotates only the log statement it wraps, so context never leaks onto the success path.
 */
const annotateLogWith = (context: UnexpectedErrorContext) => <A, E, R>(self: Effect.Effect<A, E, R>) =>
  context === undefined
    ? self
    : Effect.annotateLogs(self, context)

export const dieWithUnexpectedError = (message: string, context?: UnexpectedErrorContext) =>
  pipe(
    Effect.logError(message),
    annotateLogWith(context),
    Effect.andThen(Effect.die(UnexpectedError.make({ message, context })))
  )

export const dieWithUnexpectedErrorCallback = <E>(message: string, context?: UnexpectedErrorContext) => (error?: E) => {
  if (error instanceof UnexpectedError) {
    return pipe(
      Effect.logError(error.message, error.cause),
      annotateLogWith(error.context),
      Effect.andThen(Effect.die(error))
    )
  }

  return pipe(
    Effect.logError(message, error),
    annotateLogWith(context),
    Effect.andThen(Effect.die(UnexpectedError.make({ message, cause: error, context })))
  )
}

export const orDieWithUnexpectedError =
  <A, E, R>(message: string, context?: UnexpectedErrorContext) => (self: Effect.Effect<A, E, R>) =>
    pipe(
      self,
      Effect.tapErrorCause((cause) =>
        pipe(
          Effect.logError(message, cause),
          annotateLogWith(context)
        )
      ),
      Effect.orDieWith((error) => {
        if (error instanceof UnexpectedError) {
          return error
        }

        return UnexpectedError.make({ message, cause: error, context })
      })
    )

export const orFailWithUnexpectedError =
  <A, E, R>(message: string, context?: UnexpectedErrorContext) =>
  (self: Effect.Effect<A, E, R>): Effect.Effect<A, UnexpectedError, R> =>
    pipe(
      self,
      Effect.tapErrorCause((cause) =>
        pipe(
          Effect.logError(message, cause),
          annotateLogWith(context)
        )
      ),
      Effect.mapError((error) => {
        if (error instanceof UnexpectedError) {
          return error
        }

        return UnexpectedError.make({ message, cause: error, context })
      })
    )
