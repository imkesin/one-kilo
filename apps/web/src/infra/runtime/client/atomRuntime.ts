import { Atom } from "@effect-atom/atom-react"

export const makeAtomRuntime = Atom.context({ memoMap: Atom.defaultMemoMap })
