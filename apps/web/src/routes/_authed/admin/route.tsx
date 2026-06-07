import { createFileRoute, Outlet } from "@tanstack/react-router"

/*
 * TODO: enforce once `me` carries an admin role/permission. Read the `me` loaded by `_authed`
 * (thread via router context) and, for non-staff, throw a RedirectError (e.g. to "/") from a
 * `beforeLoad` here.
 */
export const Route = createFileRoute("/_authed/admin")({
  component: Outlet
})
