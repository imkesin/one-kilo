import * as Context from "effect/Context"
import type { Permission } from "../authorization/PermissionsAndSystemRoles.ts"
import { UserId } from "../ids/UserId.ts"
import { WorkspaceId } from "../ids/WorkspaceId.ts"

/**
 * The `Actor` service tag for dependency injection.
 *
 * @category Context
 */
export class Actor extends Context.Tag("@one-kilo/domain/Actor")<
  Actor,
  {
    readonly userId: UserId
    readonly workspaceId: WorkspaceId
    readonly permissions: ReadonlySet<Permission>
  }
>() {}
