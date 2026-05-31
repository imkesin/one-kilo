import {
  type AnyRedirect,
  type AnyRouter,
  redirect,
  type RedirectOptions,
  type RegisteredRouter
} from "@tanstack/react-router"
import * as Data from "effect/Data"
import * as Predicate from "effect/Predicate"

const TypeId = "~@one-kilo/web/RedirectError"

export class RedirectError extends Data.TaggedError("RedirectError")<{
  redirect: AnyRedirect
}> {
  readonly [TypeId] = TypeId

  /*
   * Off-router (absolute `href`) redirects. This overload is listed first and
   * is intentionally free of `RegisteredRouter`/`NavigateOptions`, so callers
   * inside route files resolve to it without pulling the route tree into their
   * inferred types — which would create a Route -> handler -> RedirectError ->
   * Route type cycle.
   */
  static make(options: {
    readonly href: string
    readonly headers?: HeadersInit
    readonly statusCode?: number
  }): RedirectError

  /*
   * In-app navigation to typed routes.
   */
  static make<
    Router extends AnyRouter = RegisteredRouter,
    const From extends string = string,
    const To extends string | undefined = string,
    const MaskFrom extends string = From,
    const MaskTo extends string = "."
  >(
    options: RedirectOptions<Router, From, To, MaskFrom, MaskTo>
  ): RedirectError

  static make(options: any): RedirectError {
    /*
     * This is a necessary type assertion; it's difficult to widen the type with all the generics.
     */
    return new RedirectError({ redirect: redirect(options) as AnyRedirect })
  }
}

export function isRedirectError(error: unknown): error is RedirectError {
  return Predicate.isTagged("RedirectError")(error)
}
