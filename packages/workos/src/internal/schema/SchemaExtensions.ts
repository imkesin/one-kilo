import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as WorkOSError from "../../domain/Errors.ts"

export const encodeCatching = <
  A,
  I
>(schema: S.Schema<A, I>) =>
(input: A) =>
  pipe(
    input,
    S.encode(schema),
    Effect.catchTag(
      "ParseError",
      (error) =>
        Effect.fail(
          WorkOSError.WorkOSCommonError.make({
            reason: WorkOSError.UnexpectedError.make({
              cause: error,
              message: "Failed to encode input"
            })
          })
        )
    )
  )
