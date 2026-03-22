import { UnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Runtime from "effect/Runtime"
import { isDynamicServerError, isRedirectError } from "~/lib/errors"
import { getManagedWebServerRuntime } from "./getManagedServerRuntime"
import type { WebServerLayerSuccess } from "./webServerLayer"

export async function runWithWebServerRuntime<
  A,
  E,
  R extends WebServerLayerSuccess
>(
  effect: Effect.Effect<A, E, R>,
  options?: { readonly signal?: AbortSignal }
) {
  const managedRuntime = getManagedWebServerRuntime()
  const runtime = await managedRuntime.runtime()

  const exit = await Runtime.runPromiseExit(runtime, effect, options)

  if (Exit.isSuccess(exit)) {
    return exit.value
  }

  const { cause } = exit

  if (cause._tag === "Fail") {
    const { error } = cause

    if (isRedirectError(error)) {
      throw error._nextCause
    }
    if (isDynamicServerError(error)) {
      throw error._nextCause
    }

    throw cause.error
  }

  throw new UnexpectedError({ message: "The server runtime failed", cause })
}
