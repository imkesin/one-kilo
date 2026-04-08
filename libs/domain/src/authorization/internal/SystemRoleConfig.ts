import { PermissionSet } from "./PermissionSet.ts"

export class SystemRoleConfig<Name extends string, Permission extends PermissionSet<string, string>> {
  readonly name: Name
  readonly permissionSets: ReadonlyArray<Permission>

  constructor(parameters: { name: Name; permissionSets: ReadonlyArray<Permission> }) {
    this.name = parameters.name
    this.permissionSets = parameters.permissionSets
  }

  static make<TName extends string, TPermission extends PermissionSet<string, string>>(
    parameters: { name: TName; permissionSets: ReadonlyArray<TPermission> }
  ) {
    return new SystemRoleConfig(parameters)
  }
}
