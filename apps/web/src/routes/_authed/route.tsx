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
import { Viewport } from "~/ui/components/root/Viewport"

const handleBeforeLoadAuthed = pipe(
  Effect.flatMap(AuthenticationWebModule, ({ currentAuthenticationContext }) => currentAuthenticationContext),
  Effect.catchTags({
    "AuthenticationContextCookieNotFoundError": () => RedirectError.make({ href: "/sign-in" }),
    "AuthenticationContextExpiredError": () => RedirectError.make({ href: "/sign-in" })
  }),
  Effect.asVoid
)
const beforeLoadAuthedServerFn = createServerFn({ method: "GET" })
  .handler(() => {
    const { signal } = getRequest()

    return runWithWebServerRuntime(handleBeforeLoadAuthed, { signal })
  })

const handleLoadAuthedData = Effect.gen(function*() {
  const usersWebProxy = yield* UsersWebProxy
  const me = yield* usersWebProxy.me()

  const registry = Registry.make({ initialValues: [meAtomInitialValue(me)] })

  return Hydration.dehydrate(registry)
})
const loadAuthedDataServerFn = createServerFn({ method: "GET" })
  .handler(() => {
    const { signal } = getRequest()

    return runWithWebServerRuntime(handleLoadAuthedData, { signal })
  })

function AuthedLayout() {
  const dehydratedState = Route.useLoaderData()

  return (
    <ReactHydration.HydrationBoundary state={dehydratedState}>
      <Viewport>
        <Outlet />
      </Viewport>
    </ReactHydration.HydrationBoundary>
  )
}

export const Route = createFileRoute("/_authed")({
  ssr: "data-only",
  beforeLoad: ({ abortController: { signal } }) => beforeLoadAuthedServerFn({ signal }),
  loader: ({ abortController: { signal } }) => loadAuthedDataServerFn({ signal }),
  staleTime: Infinity,
  component: AuthedLayout
})
