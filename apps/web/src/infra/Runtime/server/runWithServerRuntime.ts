import { UnexpectedError } from "@effect-workos/lib/errors/UnexpectedError"
import { Effect, Exit, Runtime } from "effect"
import { isDynamicServerError, isRedirectError } from "~/lib/Errors"
import { getManagedServerRuntime } from "./getManagedServerRuntime"
import type { ServerLayerSuccess } from "./serverLayer"

export async function runWithServerRuntime<
  A,
  E,
  R extends ServerLayerSuccess
>(
  effect: Effect.Effect<A, E, R>,
  options?: { readonly signal?: AbortSignal }
) {
  const managedRuntime = getManagedServerRuntime()
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
