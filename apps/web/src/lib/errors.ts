import * as S from "effect/Schema"
import { DynamicServerError as NextDynamicServerError } from "next/dist/client/components/hooks-server-context"
import { RedirectError as NextRedirectError } from "next/dist/client/components/redirect-error"

export class DynamicServerError extends S.TaggedError<DynamicServerError>()(
  "DynamicServerError",
  {
    _nextCause: S.instanceOf(NextDynamicServerError)
  },
  {
    description: "An error was thrown to indicate that a page should be re-rendered dynamically"
  }
) {
  static fromNextDynamicServerError(error: NextDynamicServerError) {
    return DynamicServerError.make({ _nextCause: error })
  }
}
export const isDynamicServerError = S.is(DynamicServerError)

export class RedirectError extends S.TaggedError<RedirectError>()(
  "RedirectError",
  {
    _nextCause: S.Defect
  },
  {
    description: "An error was thrown to indicate that this request should be redirected"
  }
) {
  static fromNextRedirectError(error: NextRedirectError) {
    return RedirectError.make({ _nextCause: error })
  }
}
export const isRedirectError = S.is(RedirectError)
