import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Url from "effect/http/Url"
import * as UrlParams from "effect/http/UrlParams"
import * as Result from "effect/Result"
import * as WorkOSError from "../../domain/Errors.ts"
import type { EnvironmentClientId } from "../../domain/Ids.ts"
import { encodeCatching } from "../schema/SchemaExtensions.ts"
import { BuildAuthorizationUrlParameters } from "./PublicApiClientDefinitionSchemas.ts"

type BuildAuthorizationUrlParameters_WithoutClientId = Omit<
  BuildAuthorizationUrlParameters,
  "clientId"
>

export interface Client {
  readonly buildAuthorizationUrl: (parameters: BuildAuthorizationUrlParameters_WithoutClientId) => Effect.Effect<
    string,
    WorkOSError.WorkOSCommonError
  >
}

export const make = (options: { apiPath: string; clientId: EnvironmentClientId }): Client => {
  return {
    buildAuthorizationUrl: (parameters) =>
      pipe(
        { ...parameters, clientId: options.clientId },
        encodeCatching(BuildAuthorizationUrlParameters),
        Effect.flatMap((_) =>
          pipe(
            Url.make(
              `${options.apiPath}/user_management/authorize`,
              UrlParams.fromInput(_),
              undefined
            ),
            Result.match({
              onFailure: (error) =>
                Effect.fail(
                  WorkOSError.WorkOSCommonError.make({
                    reason: WorkOSError.UnexpectedError.make({
                      cause: error,
                      message: "Failed to build authorization URL"
                    })
                  })
                ),
              onSuccess: (url) => Effect.succeed(url.toString())
            })
          )
        )
      )
  }
}
