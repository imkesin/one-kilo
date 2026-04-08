import { PermissionsError } from "@one-kilo/lib/errors/PermissionsError"
import type { NonEmptyReadonlyArray } from "effect/Array"
import * as Effect from "effect/Effect"
import { Actor } from "../tags/Actor.ts"
import type { Permission } from "./PermissionsAndSystemRoles.ts"

/**
 * Represents an access policy that can be evaluated against the current actor.
 * A policy is a function that returns Effect.void if access is granted,
 * or fails with a PermissionsError if access is denied.
 */
type Policy<E = never, R = never> = Effect.Effect<
  void,
  PermissionsError | E,
  Actor | R
>

/**
 * Creates a policy from a predicate function that evaluates the current actor.
 */
export const policy = <E, R>(
  predicate: (actor: Actor["Type"]) => Effect.Effect<boolean, E, R>,
  message?: string
): Policy<E, R> =>
  Effect.flatMap(Actor, (actor) =>
    Effect.flatMap(predicate(actor), (result) =>
      result
        ? Effect.void
        : Effect.fail(
          message !== undefined
            ? new PermissionsError({ message })
            : new PermissionsError()
        )))

const allPermissions = policy((actor) => Effect.succeed(actor.permissions.has("*")))

/**
 * Applies a predicate as a pre-check to an effect.
 * If the predicate returns false, the effect will fail with a PermissionsError.
 */
export const withPolicy = <E, R>(policy: Policy<E, R>) => <A, E2, R2>(self: Effect.Effect<A, E2, R2>) =>
  Effect.andThen(
    any(policy, allPermissions),
    self
  )

/**
 * Composes multiple policies with AND semantics - all policies must pass.
 * Returns a new policy that succeeds only if all the given policies succeed.
 */
export const all = <E, R>(...policies: NonEmptyReadonlyArray<Policy<E, R>>): Policy<E, R> =>
  Effect.all(policies, {
    concurrency: 1,
    discard: true
  })

/**
 * Composes multiple policies with OR semantics - at least one policy must pass.
 * Returns a new policy that succeeds if any of the given policies succeed.
 */
export const any = <E, R>(...policies: NonEmptyReadonlyArray<Policy<E, R>>): Policy<E, R> =>
  Effect.firstSuccessOf(policies)

/**
 * Creates a policy that checks if the actor has a specific permission.
 */
export const permission = (requiredPermission: Exclude<Permission, "*">): Policy =>
  policy((actor) => Effect.succeed(actor.permissions.has(requiredPermission)))
