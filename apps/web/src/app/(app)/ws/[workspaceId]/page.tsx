import * as Effect from "effect/Effect"
import { runWithWebServerRuntime } from "~/infra/runtime/server/runWithServerRuntime"

const workspacesPage = Effect.succeed(
  <div>
    <h1>Workspaces Page</h1>
  </div>
)

export default async function WorkspacesPage() {
  return runWithWebServerRuntime(workspacesPage)
}
