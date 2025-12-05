import { Effect, pipe, Schema } from "effect"

export class UnexpectedError extends Schema.TaggedError<UnexpectedError>("@motte/lib/UnexpectedError")(
  "UnexpectedError",
  {
    cause: Schema.optional(Schema.Defect),
    context: Schema.optional(Schema.Record({
      key: Schema.NonEmptyTrimmedString,
      value: Schema.Unknown
    })),
    message: Schema.NonEmptyTrimmedString
  },
  {
    description: "An unexpected error occurred."
  }
) {}

export const dieWithUnexpectedError = (message: string) =>
  pipe(
    Effect.logError(message),
    Effect.flatMap(() => Effect.die(new UnexpectedError({ message })))
  )

export const dieWithUnexpectedErrorCallback = <E>(message: string) => (error?: E) => {
  if (error instanceof UnexpectedError) {
    return pipe(
      Effect.logError(error.message, error.cause),
      Effect.flatMap(() => Effect.die(error))
    )
  }

  return pipe(
    Effect.logError(message, error),
    Effect.flatMap(() => Effect.die(new UnexpectedError({ message, cause: error })))
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
