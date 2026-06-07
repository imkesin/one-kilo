import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_authed/admin/_framed")({
  component: Outlet
})
