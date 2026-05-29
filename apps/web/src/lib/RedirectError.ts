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

  static make = <
    Router extends AnyRouter = RegisteredRouter,
    const From extends string = string,
    const To extends string | undefined = string,
    const MaskFrom extends string = From,
    const MaskTo extends string = "."
  >(
    options: RedirectOptions<
      Router,
      From,
      To,
      MaskFrom,
      MaskTo
    >
  ) => {
    /*
     * This is a necessary type assertion; it's difficult to widen the type with all the generics.
     */
    return new RedirectError({ redirect: redirect(options) as AnyRedirect })
  }
}

export function isRedirectError(error: unknown): error is RedirectError {
  return Predicate.isTagged("RedirectError")(error)
}
