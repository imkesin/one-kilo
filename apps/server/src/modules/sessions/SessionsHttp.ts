import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import { Sessions_ExchangeCode_ApiSchemas } from "@one-kilo/server-api/modules/sessions/SessionsApiSchemas"
import { ServerApi } from "@one-kilo/server-api/ServerApi"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { SessionsOrchestrator } from "../../processes/sessions/SessionsOrchestrator.ts"

export const SessionsHttp = HttpApiBuilder.group(
  ServerApi,
  "sessions",
  Effect.fn(function*(handlers) {
    const sessionsOrchestrator = yield* SessionsOrchestrator

    return handlers.handle(
      "exchangeCode",
      Effect.fn(function*({ payload }) {
        const authenticationContext = yield* pipe(
          sessionsOrchestrator.exchangeCodeForSession({ code: payload.code }),
          Effect.catchTag(
            "InvalidAuthenticationCodeError",
            () => Effect.fail(Sessions_ExchangeCode_ApiSchemas.InvalidCodeError.make())
          )
        )

        return Sessions_ExchangeCode_ApiSchemas.Success.make({ authenticationContext })
      })
    )
  })
).pipe(
  Layer.provide(SessionsOrchestrator.Default)
)
