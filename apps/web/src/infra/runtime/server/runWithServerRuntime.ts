import { redirect } from "@tanstack/react-router"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Option from "effect/Option"
import { isRedirectError } from "~/lib/RedirectError"
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

  const exit = await managedRuntime.runPromiseExit(effect, options)

  if (Exit.isSuccess(exit)) {
    return exit.value
  }

  const { cause } = exit

  const failure = Cause.findErrorOption(cause)
  if (Option.isSome(failure) && isRedirectError(failure.value)) {
    throw failure.value.redirect
  }

  /*
   * Client-cancelled requests surface as interrupts, not faults: there is no
   * one left to redirect and logging them as errors would be noise.
   */
  if (Cause.hasInterruptsOnly(cause)) {
    throw Cause.squash(cause)
  }

  managedRuntime.runSync(Effect.logError("Unhandled fatal server error", cause))

  throw redirect({ href: "/error", statusCode: 303 })
}
