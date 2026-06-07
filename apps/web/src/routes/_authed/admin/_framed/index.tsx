import { createFileRoute } from "@tanstack/react-router"

/*
 * TODO: build out admin management pages
 */
function AdminIndexPage() {
  return <h1>Admin</h1>
}

export const Route = createFileRoute("/_authed/admin/_framed/")({
  component: AdminIndexPage
})
