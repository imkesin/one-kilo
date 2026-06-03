import * as WorkOSValues from "@effect/auth-workos/domain/Values"
import * as UrlParams from "@effect/platform/UrlParams"
import { createFileRoute } from "@tanstack/react-router"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { runWithWebServerRuntime } from "~/infra/runtime/server/runWithServerRuntime"
import { RedirectError } from "~/lib/RedirectError"
import { AuthenticationWebModule } from "~/modules/authentication/server/AuthenticationWebModule"

const SignInCallbackSearchParams = S.Struct({
  code: WorkOSValues.AuthenticationCode
})

const handleSignInCallback = Effect.fn(
  function*(url: string) {
    const { code } = yield* pipe(
      new URL(url).searchParams,
      UrlParams.fromInput,
      UrlParams.schemaStruct(SignInCallbackSearchParams)
    )

    const { handleExchangeCode } = yield* AuthenticationWebModule

    const { workspaceId } = yield* handleExchangeCode(code)

    return yield* RedirectError.make({
      to: "/ws/$workspaceId",
      params: { workspaceId }
    })
  }
)

export const Route = createFileRoute("/(auth)/sign-in/callback")({
  server: {
    handlers: {
      GET: ({ request: { url, signal } }) => runWithWebServerRuntime(handleSignInCallback(url), { signal })
    }
  }
})
