import "server-only"

import { UnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import { isRedirectError as isNextRedirectError } from "next/dist/client/components/redirect-error"
import { redirect } from "next/navigation"
import { RedirectError } from "~/lib/errors"

export const serverRedirect = ({ url }: { url: string }) =>
  pipe(
    Effect.try({
      try: () => redirect(url),
      catch: (error) => {
        if (isNextRedirectError(error)) {
          return RedirectError.fromNextRedirectError(error)
        }

        return UnexpectedError.make({ message: "Failed to redirect", cause: error })
      }
    }),
    Effect.catchTag("UnexpectedError", Effect.die)
  )
