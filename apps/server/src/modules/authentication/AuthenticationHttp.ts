import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import {
  AuthenticationApi_ExchangeCodeSchemas,
  AuthenticationApi_RefreshContextSchemas
} from "@one-kilo/server-api/modules/authentication/AuthenticationApiSchemas"
import { ServerApi } from "@one-kilo/server-api/ServerApi"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import { AuthenticationOrchestrator } from "../../processes/authentication/AuthenticationOrchestrator.ts"
import { AuthenticationUseCases } from "../../processes/authentication/AuthenticationUseCases.ts"

export const AuthenticationHttp = HttpApiBuilder.group(
  ServerApi,
  "authentication",
  Effect.fn(function*(handlers) {
    const authenticationOrchestrator = yield* AuthenticationOrchestrator
    const authenticationUseCases = yield* AuthenticationUseCases

    return handlers
      .handle(
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
      .handle(
        "refreshContext",
        Effect.fn(function*({ payload }) {
          const authenticationContext = yield* authenticationUseCases.refreshContext({
            refreshToken: payload.refreshToken
          })

          return AuthenticationApi_RefreshContextSchemas.Success.make({ authenticationContext })
        })
      )
  })
).pipe(
  Layer.provide([AuthenticationOrchestrator.Default, AuthenticationUseCases.Default])
)
