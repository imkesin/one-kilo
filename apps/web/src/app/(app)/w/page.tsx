import { Effect } from "effect"
import { runWithServerRuntime } from "~/infra/Runtime/server/runWithServerRuntime"

const workspacesPage = Effect.succeed(
  <div>
    <h1>Workspaces Page</h1>
  </div>
)

export default async function WorkspacesPage() {
  return runWithServerRuntime(workspacesPage)
}
