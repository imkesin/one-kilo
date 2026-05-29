import * as WorkOSPublicApiClient from "@effect/auth-workos/PublicApiClient"
import { createFileRoute } from "@tanstack/react-router"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import { runWithWebServerRuntime } from "~/infra/runtime/server/runWithServerRuntime"
import { RedirectError } from "~/lib/RedirectError"

const signInEffect = Effect.gen(function*() {
  const workosPublicClient = yield* WorkOSPublicApiClient.PublicApiClient

  const port = yield* pipe(
    Config.number("PORT"),
    Config.withDefault(11000)
  )

  const authUrl = yield* workosPublicClient.userManagement.buildAuthorizationUrl({
    screenHint: "sign-in",
    provider: "authkit",
    redirectUri: `http://localhost:${port}/sign-in/callback`
  })

  yield* Effect.log(`Redirecting to Auth URL: ${authUrl}`)

  return yield* RedirectError.make({ href: authUrl, statusCode: 302 })
})

export const Route = createFileRoute("/(auth)/sign-in")({
  server: {
    handlers: {
      GET: (): Promise<Response> => runWithWebServerRuntime(signInEffect)
    }
  }
})
