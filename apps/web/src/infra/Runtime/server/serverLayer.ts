import { Layer } from "effect"

export const serverLayer = Layer.empty
export type ServerLayerSuccess = Layer.Layer.Success<typeof serverLayer>
