import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { getAuthSession } from "~/modules/authentication/server/getAuthSession"

/*
 * Pathless layout that gates the authenticated zone.
 *
 * `ssr: "data-only"` keeps component rendering on the client (SPA-like) while
 * letting `beforeLoad` run on the server during the initial document request —
 * so a hard load of an authed URL is gated with a clean 302 (no auth flash),
 * and client-side navigations call the same server function.
 *
 * The httpOnly session cookie can only be read server-side, so the gate goes
 * through the `getAuthSession` server function rather than reading the cookie
 * directly here.
 */
export const Route = createFileRoute("/_app")({
  ssr: "data-only",
  beforeLoad: async () => {
    const session = await getAuthSession()

    if (session === null) {
      throw redirect({ href: "/sign-in" })
    }

    return { session }
  },
  component: AuthedLayout
})

function AuthedLayout() {
  return <Outlet />
}
