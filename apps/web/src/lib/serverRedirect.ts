import "server-only"

import { UnexpectedError } from "@effect-workos/lib/errors/UnexpectedError"
import { Effect, pipe } from "effect"
import { isRedirectError as isNextRedirectError } from "next/dist/client/components/redirect-error"
import { redirect } from "next/navigation"
import { RedirectError } from "~/lib/Errors"

export const serverRedirect = ({ url }: { url: string }) =>
  pipe(
    Effect.try({
      try: () => redirect(url),
      catch: (error) => {
        if (isNextRedirectError(error)) {
          return RedirectError.fromNextRedirectError(error)
        }

        return new UnexpectedError({ message: "Failed to redirect", cause: error })
      }
    }),
    Effect.catchTag("UnexpectedError", Effect.die)
  )
