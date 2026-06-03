import * as ManagedRuntime from "effect/ManagedRuntime"
import { type WebServerLayerSuccess, WebServerLive } from "./webServerLayer"

type WebServerManagedRuntime = ManagedRuntime.ManagedRuntime<WebServerLayerSuccess, unknown>

declare global {
  var __STATIC_MANAGED_WEB_SERVER_RUNTIME: WebServerManagedRuntime | undefined
}

export function getManagedWebServerRuntime() {
  if (!global.__STATIC_MANAGED_WEB_SERVER_RUNTIME) {
    const runtime = ManagedRuntime.make(WebServerLive)

    global.__STATIC_MANAGED_WEB_SERVER_RUNTIME = runtime

    // TODO: Is this the correct place to dispose? What about in `api.$.tsx`?
    const shutdown = () => {
      void runtime.dispose()
    }

    process.on("SIGTERM", shutdown)
    process.on("SIGINT", shutdown)
  }

  return global.__STATIC_MANAGED_WEB_SERVER_RUNTIME
}
