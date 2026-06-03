import { Hydration, Registry } from "@effect-atom/atom-react"
import * as ReactHydration from "@effect-atom/atom-react/ReactHydration"
import { createFileRoute, Outlet } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import { runWithWebServerRuntime } from "~/infra/runtime/server/runWithServerRuntime"
import { RedirectError } from "~/lib/RedirectError"
import { AuthenticationWebModule } from "~/modules/authentication/server/AuthenticationWebModule"
import { UsersWebProxy } from "~/modules/users/server/UsersWebProxy"
import { meAtomInitialValue } from "~/modules/users/usersAtoms"

/*
 * TODO: Better error handling
 */
const handleBeforeLoadAppRoute = pipe(
  Effect.flatMap(AuthenticationWebModule, ({ currentAuthenticationContext }) => currentAuthenticationContext),
  Effect.catchTags({
    "Authentication:ContextCookieNotFoundError": () => Effect.fail(RedirectError.make({ href: "/sign-in" })),
    "Authentication:ContextExpiredError": () => Effect.fail(RedirectError.make({ href: "/sign-in" }))
  }),
  Effect.asVoid
)
const beforeLoadAppRouteServerFn = createServerFn({ method: "GET" })
  .handler(() => {
    const { signal } = getRequest()

    return runWithWebServerRuntime(handleBeforeLoadAppRoute, { signal })
  })

const handleLoadAppRouteData = Effect.gen(function*() {
  const usersWebProxy = yield* UsersWebProxy
  const me = yield* usersWebProxy.me()

  const registry = Registry.make({ initialValues: [meAtomInitialValue(me)] })

  return Hydration.dehydrate(registry)
})
const loadAppRouteDataServerFn = createServerFn({ method: "GET" })
  .handler(() => {
    const { signal } = getRequest()

    return runWithWebServerRuntime(handleLoadAppRouteData, { signal })
  })

function AuthedLayout() {
  const dehydratedState = Route.useLoaderData()

  return (
    <ReactHydration.HydrationBoundary state={dehydratedState}>
      <Outlet />
    </ReactHydration.HydrationBoundary>
  )
}

export const Route = createFileRoute("/_app")({
  ssr: "data-only",
  beforeLoad: ({ abortController: { signal } }) => beforeLoadAppRouteServerFn({ signal }),
  loader: ({ abortController: { signal } }) => loadAppRouteDataServerFn({ signal }),
  staleTime: Infinity,
  component: AuthedLayout
})
