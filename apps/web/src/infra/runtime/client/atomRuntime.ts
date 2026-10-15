import * as Layer from "effect/Layer"
import * as Atom from "effect/reactivity/Atom"

/*
 * A single memo map shared by every runtime created from this factory, so layers are built once per page.
 */
export const makeAtomRuntime = Atom.context({ memoMap: Layer.makeMemoMapUnsafe() })
