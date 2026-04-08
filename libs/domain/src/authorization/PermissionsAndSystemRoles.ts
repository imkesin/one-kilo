import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { SystemRoleConfig } from "./internal/SystemRoleConfig.ts"

/*
 * This is a special case that intentionally side-steps the `ResourceConfig` constructor.
 */
const allResource = {
  name: "all",
  actions: ["*"],
  permissions: ["*"]
} as const

const resources = [allResource] as const
const permissionsIdentifiers = resources.flatMap((resource) => resource.permissions)

export const Permission = pipe(
  S.Literal(...permissionsIdentifiers),
  S.annotations({
    identifier: "Permission",
    title: "Permission"
  })
)
export type Permission = typeof Permission.Type

const adminRole = SystemRoleConfig.make({
  name: "Admin",
  permissionSets: [allResource]
})
const userRole = SystemRoleConfig.make({
  name: "User",
  permissionSets: []
})

const systemRoleConfigs = [adminRole, userRole] as const
const systemRoleIdentifiers = systemRoleConfigs.map((role) => role.name)

export const systemRoleLookup = new Map(systemRoleConfigs.map((role) => [role.name, role] as const))

export const SystemRole = pipe(
  S.Literal(...systemRoleIdentifiers),
  S.annotations({
    identifier: "SystemRole",
    title: "System Role"
  })
)
export type SystemRole = typeof SystemRole.Type
