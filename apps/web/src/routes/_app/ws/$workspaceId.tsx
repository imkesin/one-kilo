import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/ws/$workspaceId")({
  component: WorkspacePage
})

function WorkspacePage() {
  return (
    <div>
      <h1>Workspace Page</h1>
    </div>
  )
}
