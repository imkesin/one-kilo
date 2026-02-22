import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"

export class UnexpectedError extends S.TaggedError<UnexpectedError>("@one-kilo/lib/UnexpectedError")(
  "UnexpectedError",
  {
    cause: S.optional(S.Defect),
    context: S.optional(S.Record({
      key: S.NonEmptyTrimmedString,
      value: S.Unknown
    })),
    message: S.NonEmptyTrimmedString
  },
  {
    description: "An unexpected error occurred."
  }
) {}

export const dieWithUnexpectedError = (message: string) =>
  pipe(
    Effect.logError(message),
    Effect.andThen(Effect.die(new UnexpectedError({ message })))
  )

export const dieWithUnexpectedErrorCallback = <E>(message: string) => (error?: E) => {
  if (error instanceof UnexpectedError) {
    return pipe(
      Effect.logError(error.message, error.cause),
      Effect.andThen(Effect.die(error))
    )
  }

  return pipe(
    Effect.logError(message, error),
    Effect.andThen(Effect.die(new UnexpectedError({ message, cause: error })))
  )
}

export const orDieWithUnexpectedError = <A, E, R>(message: string) => (self: Effect.Effect<A, E, R>) =>
  pipe(
    self,
    Effect.tapError((error) => Effect.logError(message, error)),
    Effect.orDieWith((error) => {
      if (error instanceof UnexpectedError) {
        return error
      }

      return new UnexpectedError({ message, cause: error })
    })
  )
