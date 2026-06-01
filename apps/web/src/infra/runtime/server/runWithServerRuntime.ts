import { redirect } from "@tanstack/react-router"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Runtime from "effect/Runtime"
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
  const runtime = await managedRuntime.runtime()

  const exit = await Runtime.runPromiseExit(runtime, effect, options)

  if (Exit.isSuccess(exit)) {
    return exit.value
  }

  const { cause } = exit

  if (cause._tag === "Fail" && isRedirectError(cause.error)) {
    throw cause.error.redirect
  }

  /*
   * Client-cancelled requests surface as interrupts, not faults: there is no
   * one left to redirect and logging them as errors would be noise.
   */
  if (Cause.isInterruptedOnly(cause)) {
    throw Cause.squash(cause)
  }

  /*
   * Log before redirecting — the redirect is the only signal that escapes, so
   * an unlogged cause is lost. 303 (not 302/307) forces the follow-up to GET,
   * so a fatal POST doesn't re-POST to `/error`.
   */
  Runtime.runSync(runtime, Effect.logError("Unhandled fatal server error", cause))

  throw redirect({ href: "/error", statusCode: 303 })
}
