import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import { AuthenticationApi_ExchangeCodeSchemas } from "@one-kilo/server-api/modules/authentication/AuthenticationApiSchemas"
import { ServerApi } from "@one-kilo/server-api/ServerApi"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { AuthenticationOrchestrator } from "../../processes/authentication/AuthenticationOrchestrator.ts"

export const AuthenticationHttp = HttpApiBuilder.group(
  ServerApi,
  "authentication",
  Effect.fn(function*(handlers) {
    const authenticationOrchestrator = yield* AuthenticationOrchestrator

    return handlers.handle(
      "exchangeCode",
      Effect.fn(function*({ payload }) {
        const authenticationContext = yield* pipe(
          authenticationOrchestrator.exchangeCode({ code: payload.code }),
          Effect.catchTag(
            "InvalidAuthenticationCodeError",
            () => Effect.fail(AuthenticationApi_ExchangeCodeSchemas.Error.InvalidCode.make())
          )
        )

        return AuthenticationApi_ExchangeCodeSchemas.Success.make({ authenticationContext })
      })
    )
  })
).pipe(
  Layer.provide(AuthenticationOrchestrator.Default)
)
