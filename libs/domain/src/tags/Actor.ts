import * as Context from "effect/Context"
import type { Permission } from "../authorization/PermissionsAndSystemRoles.ts"
import type { ActorIdentity } from "../values/ActorValues.ts"

/**
 * The `Actor` service tag for dependency injection.
 *
 * @category Context
 */
export class Actor extends Context.Tag("@one-kilo/domain/Actor")<
  Actor,
  ActorIdentity & { readonly permissions: ReadonlySet<Permission> }
>() {}
