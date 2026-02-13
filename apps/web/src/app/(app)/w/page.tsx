import * as Effect from "effect/Effect"
import { runWithServerRuntime } from "~/infra/runtime/server/runWithServerRuntime"

const workspacesPage = Effect.succeed(
  <div>
    <h1>Workspaces Page</h1>
  </div>
)

export default async function WorkspacesPage() {
  return runWithServerRuntime(workspacesPage)
}
