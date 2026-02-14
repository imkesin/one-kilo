import { UnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Runtime from "effect/Runtime"
import { isDynamicServerError, isRedirectError } from "~/lib/errors"
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
