import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { getAuthSession } from "~/modules/authentication/server/getAuthSession"

/*
 * Pathless layout that gates the authenticated zone.
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
