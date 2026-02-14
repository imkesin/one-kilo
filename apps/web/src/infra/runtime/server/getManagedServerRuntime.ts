import * as ManagedRuntime from "effect/ManagedRuntime"
import { serverLayer, type ServerLayerSuccess } from "./serverLayer"

type ServerManagedRuntime = ManagedRuntime.ManagedRuntime<ServerLayerSuccess, unknown>

declare global {
  var __STATIC_MANAGED_SERVER_RUNTIME: ServerManagedRuntime | undefined
}

export function getManagedServerRuntime() {
  if (!global.__STATIC_MANAGED_SERVER_RUNTIME) {
    global.__STATIC_MANAGED_SERVER_RUNTIME = ManagedRuntime.make(serverLayer)
  }
  return global.__STATIC_MANAGED_SERVER_RUNTIME
}
