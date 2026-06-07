import { createFileRoute, Outlet } from "@tanstack/react-router"

/*
 * TODO: enforce once `me` carries an onboarding-complete flag. Read the `me` loaded by `_authed`
 * (thread it through router context from the parent rather than refetching) and, when incomplete,
 *   throw RedirectError.make({ to: "/onboarding" })
 * from a `beforeLoad` here.
 */
export const Route = createFileRoute("/_authed/_app")({
  component: Outlet
})
