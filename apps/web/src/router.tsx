import { createRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"
import { FatalErrorScreen } from "./ui/components/error/FatalErrorScreen"

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    defaultErrorComponent: ({ reset }) => <FatalErrorScreen variant="boundary" onRetry={reset} />,
    defaultNotFoundComponent: () => <FatalErrorScreen variant="notFound" />
  })
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
