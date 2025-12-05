import { getManagedServerRuntime } from "./infra/Runtime/server/getManagedServerRuntime"

export function register() {
  const managedRuntime = getManagedServerRuntime()

  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.on("SIGTERM", () => {
      managedRuntime.dispose()
    })
    process.on("SIGINT", () => {
      managedRuntime.dispose()
    })
  }
}
