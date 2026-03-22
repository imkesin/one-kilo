import * as WorkOSValues from "@effect/auth-workos/domain/Values"
import * as UrlParams from "@effect/platform/UrlParams"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { NextRequest } from "next/server"
import { buildWorkspacePageUrl } from "~/app/(app)/w/[workspaceId]/url"
import { runWithWebServerRuntime } from "~/infra/runtime/server/runWithServerRuntime"
import { serverRedirect } from "~/lib/serverRedirect"
import { AuthenticationWebModule } from "~/modules/authentication/server/AuthenticationWebModule"

const CallbackSearchParams = S.Struct({
  code: WorkOSValues.AuthenticationCode
})

const callbackRoute = Effect.fn(function*(request: NextRequest) {
  const searchParams = yield* pipe(
    request.nextUrl.searchParams,
    UrlParams.fromInput,
    UrlParams.schemaStruct(CallbackSearchParams)
  )

  const authenticationWebModule = yield* AuthenticationWebModule

  const { workspaceId } = yield* authenticationWebModule.handleExchangeCode(searchParams.code)

  return yield* serverRedirect({ url: buildWorkspacePageUrl(workspaceId) })
})

export const GET = async (request: NextRequest) => {
  return runWithWebServerRuntime(
    callbackRoute(request),
    { signal: request.signal }
  )
}
