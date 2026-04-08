import * as Arr from "effect/Array"

export class PermissionSet<Name extends string, Action extends string> {
  readonly name: Name
  readonly actions: Arr.NonEmptyReadonlyArray<Action>

  constructor(parameters: { name: Name; actions: Arr.NonEmptyReadonlyArray<Action> }) {
    this.name = parameters.name
    this.actions = parameters.actions
  }

  static make<Name extends string, Action extends string>(
    parameters: { name: Name; actions: Arr.NonEmptyReadonlyArray<Action> }
  ) {
    return new PermissionSet(parameters)
  }

  /*
   * The explicit return type intentionally includes the `*` permission.
   */
  get permissions(): Arr.NonEmptyReadonlyArray<`${Name}:${Action}` | "*"> {
    return Arr.map(
      this.actions,
      (action) => `${this.name}:${action}` as const
    )
  }
}
