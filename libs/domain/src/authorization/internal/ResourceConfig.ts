import * as Arr from "effect/Array"
import { PermissionSet } from "./PermissionSet.ts"

export class ResourceConfig<Name extends string, Action extends string> {
  readonly actions: Arr.NonEmptyReadonlyArray<Action>
  readonly name: Name

  constructor(parameters: { actions: Arr.NonEmptyReadonlyArray<Action>; name: Name }) {
    this.actions = parameters.actions
    this.name = parameters.name
  }

  static make<Name extends string, Action extends string>(
    parameters: { name: Name; actions: Arr.NonEmptyReadonlyArray<Action> }
  ) {
    return new ResourceConfig(parameters)
  }

  selectSubset<T extends Action>({ actions }: { actions: Arr.NonEmptyReadonlyArray<T> }) {
    return PermissionSet.make({ name: this.name, actions })
  }

  get permissions() {
    return Arr.map(
      this.actions,
      (action) => `${this.name}:${action}` as const
    )
  }
}
