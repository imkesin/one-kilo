import * as UrlParams from "@effect/platform/UrlParams"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import type { ParseError } from "effect/ParseResult"
import * as S from "effect/Schema"
import type { EnvironmentClientId } from "../../domain/Ids.ts"
import { InvalidUrlError } from "../CommonErrors.js"
import { BuildAuthorizationUrlParameters } from "./PublicApiClientDefinitionSchemas.ts"

type BuildAuthorizationUrlParameters_WithoutClientId = Omit<
  typeof BuildAuthorizationUrlParameters.Type,
  "clientId"
>

export interface Client {
  readonly buildAuthorizationUrl: (parameters: BuildAuthorizationUrlParameters_WithoutClientId) => Effect.Effect<
    string,
    InvalidUrlError | ParseError
  >
}

export const make = (options: { apiPath: string; clientId: EnvironmentClientId }): Client => {
  return {
    buildAuthorizationUrl: (parameters) =>
      pipe(
        { ...parameters, clientId: options.clientId },
        S.encode(BuildAuthorizationUrlParameters),
        Effect.flatMap((_) =>
          pipe(
            UrlParams.makeUrl(
              `${options.apiPath}/user_management/authorize`,
              UrlParams.fromInput(_),
              Option.none()
            ),
            Either.match({
              onLeft: (error) => Effect.fail(new InvalidUrlError({ cause: error })),
              onRight: (url) => Effect.succeed(url.toString())
            })
          )
        )
      )
  }
}
