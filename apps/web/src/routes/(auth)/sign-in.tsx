import * as WorkOSPublicApiClient from "@effect/auth-workos/PublicApiClient"
import { createFileRoute } from "@tanstack/react-router"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import { runWithWebServerRuntime } from "~/infra/runtime/server/runWithServerRuntime"
import { RedirectError } from "~/lib/RedirectError"

const handleSignInRedirect = Effect.fn(function*() {
  const workosPublicClient = yield* WorkOSPublicApiClient.PublicApiClient

  const baseUrl = yield* pipe(
    Config.url("WEB_PUBLIC_BASE_URL"),
    Config.withDefault(new URL("http://localhost:11000"))
  )
  const redirectUri = new URL("/sign-in/callback", baseUrl).toString()

  const authUrl = yield* workosPublicClient.userManagement.buildAuthorizationUrl({
    screenHint: "sign-in",
    provider: "authkit",
    redirectUri
  })

  yield* Effect.log(`Redirecting to Auth URL: ${authUrl}`)

  return yield* RedirectError.make({ href: authUrl, statusCode: 302 })
})

export const Route = createFileRoute("/(auth)/sign-in")({
  server: {
    handlers: {
      GET: () => runWithWebServerRuntime(handleSignInRedirect())
    }
  }
})
