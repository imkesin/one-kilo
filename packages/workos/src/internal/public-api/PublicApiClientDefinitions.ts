import * as UrlParams from "@effect/platform/UrlParams"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as WorkOSError from "../../domain/Errors.ts"
import type { EnvironmentClientId } from "../../domain/Ids.ts"
import { encodeCatching } from "../schema/SchemaExtensions.ts"
import { BuildAuthorizationUrlParameters } from "./PublicApiClientDefinitionSchemas.ts"

type BuildAuthorizationUrlParameters_WithoutClientId = Omit<
  typeof BuildAuthorizationUrlParameters.Type,
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
            UrlParams.makeUrl(
              `${options.apiPath}/user_management/authorize`,
              UrlParams.fromInput(_),
              Option.none()
            ),
            Either.match({
              onLeft: (error) =>
                Effect.fail(
                  new WorkOSError.WorkOSCommonError({
                    reason: new WorkOSError.UnexpectedError({
                      cause: error,
                      message: "Failed to build authorization URL"
                    })
                  })
                ),
              onRight: (url) => Effect.succeed(url.toString())
            })
          )
        )
      )
  }
}
