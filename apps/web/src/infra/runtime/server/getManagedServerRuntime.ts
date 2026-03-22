import * as ManagedRuntime from "effect/ManagedRuntime"
import { type WebServerLayerSuccess, WebServerLive } from "./webServerLayer"

type WebServerManagedRuntime = ManagedRuntime.ManagedRuntime<WebServerLayerSuccess, unknown>

declare global {
  var __STATIC_MANAGED_WEB_SERVER_RUNTIME: WebServerManagedRuntime | undefined
}

export function getManagedWebServerRuntime() {
  if (!global.__STATIC_MANAGED_WEB_SERVER_RUNTIME) {
    global.__STATIC_MANAGED_WEB_SERVER_RUNTIME = ManagedRuntime.make(WebServerLive)
  }
  return global.__STATIC_MANAGED_WEB_SERVER_RUNTIME
}
