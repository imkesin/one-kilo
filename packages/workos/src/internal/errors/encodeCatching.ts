import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as WorkOSError from "../../errors/Errors.ts"

export const encodeCatching = <
  A,
  I
>(schema: S.Schema<A, I>) =>
(input: A) =>
  pipe(
    input,
    S.encode(schema),
    Effect.catchTag("ParseError", (error) =>
      Effect.fail(
        new WorkOSError.WorkOSError({
          reason: new WorkOSError.EncodingError({ cause: error })
        })
      ))
  )
