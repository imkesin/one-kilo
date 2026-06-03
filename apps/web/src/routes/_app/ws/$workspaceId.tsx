import { createFileRoute } from "@tanstack/react-router"

function WorkspacePage() {
  return (
    <div>
      <h1>Workspace Page</h1>
    </div>
  )
}

export const Route = createFileRoute("/_app/ws/$workspaceId")({
  component: WorkspacePage
})
