import { getManagedWebServerRuntime } from "./infra/runtime/server/getManagedServerRuntime"

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const managedServerRuntime = getManagedWebServerRuntime()

    const shutdown = () => {
      managedServerRuntime.dispose()
    }

    process.on("SIGTERM", shutdown)
    process.on("SIGINT", shutdown)
  }
}
