import * as Effect from "effect/Effect"
import * as React from "react"
import { runWithWebServerRuntime } from "~/infra/runtime/server/runWithServerRuntime"
import { serverRedirect } from "~/lib/serverRedirect"
import * as AuthenticationWebExtensions from "~/modules/authentication/server/AuthenticationWebExtensions"
import { signInRouteUrl } from "../(auth)/sign-in/url"

const appLayoutEffect = Effect.fn(
  function*({ children }: React.PropsWithChildren) {
    // TODO: Remove placeholder
    yield* Effect.log("App layout effect")

    return children
  },
  AuthenticationWebExtensions.withCurrentAuthenticationContextOr(() => serverRedirect({ url: signInRouteUrl }))
)

export default function AppLayout({ children }: React.PropsWithChildren) {
  return runWithWebServerRuntime(appLayoutEffect({ children }))
}
