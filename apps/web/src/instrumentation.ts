import { getManagedServerRuntime } from "./infra/runtime/server/getManagedServerRuntime"

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const managedServerRuntime = getManagedServerRuntime()

    const shutdown = () => {
      managedServerRuntime.dispose()
    }

    process.on("SIGTERM", shutdown)
    process.on("SIGINT", shutdown)
  }
}
