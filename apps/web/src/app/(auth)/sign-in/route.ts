import * as WorkOSPublicApiClient from "@effect/auth-workos/PublicApiClient"
import * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import type { NextRequest } from "next/server"
import { runWithServerRuntime } from "~/infra/runtime/server/runWithServerRuntime"
import { serverRedirect } from "~/lib/serverRedirect"

const signInRoute = Effect.gen(function*() {
  const workosPublicClient = yield* WorkOSPublicApiClient.PublicApiClient

  const port = yield* Config.number("PORT")

  const authUrl = yield* workosPublicClient.userManagement.buildAuthorizationUrl({
    screenHint: "sign-in",
    provider: "authkit",
    redirectUri: `http://localhost:${port}/sign-in/callback`
  })

  yield* Effect.log(`Redirecting to Auth URL: ${authUrl}`)

  return yield* serverRedirect({ url: authUrl })
})

export async function GET(request: NextRequest) {
  console.log("Going to sign-in", request.url)

  return runWithServerRuntime(
    signInRoute,
    { signal: request.signal }
  )
}
