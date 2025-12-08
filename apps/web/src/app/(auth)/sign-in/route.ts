import * as WorkOSPublicApiClient from "@effect-workos/workos/PublicApiClient"
import { Effect } from "effect"
import type { NextRequest } from "next/server"
import { runWithServerRuntime } from "~/infra/Runtime/server/runWithServerRuntime"
import { serverRedirect } from "~/lib/serverRedirect"

const signInRoute = Effect.gen(function*() {
  const { client } = yield* WorkOSPublicApiClient.PublicApiClient

  const authUrl = yield* client.userManagement.buildAuthorizationUrl({
    screenHint: "sign-in",
    provider: "authkit",
    redirectUri: "http://localhost:3000/sign-in/callback"
  })

  yield* Effect.log(`Redirecting to Auth URL: ${authUrl}`)

  return yield* serverRedirect({ url: authUrl })
})

export async function GET(request: NextRequest) {
  return runWithServerRuntime(
    signInRoute,
    { signal: request.signal }
  )
}
