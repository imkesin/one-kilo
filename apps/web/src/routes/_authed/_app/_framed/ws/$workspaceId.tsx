import { createFileRoute } from "@tanstack/react-router"

function WorkspacePage() {
  return (
    <div>
      <h1>Workspace Page</h1>
    </div>
  )
}

export const Route = createFileRoute("/_authed/_app/_framed/ws/$workspaceId")({
  component: WorkspacePage
})
