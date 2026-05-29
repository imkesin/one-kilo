import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/u/$userId")({
  component: UserPage
})

function UserPage() {
  return (
    <div>
      <h1>User Page</h1>
    </div>
  )
}
