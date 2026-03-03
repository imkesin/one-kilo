import * as UrlParams from "@effect/platform/UrlParams"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import type { ParseError } from "effect/ParseResult"
import * as S from "effect/Schema"
import { InvalidUrlError } from "../CommonErrors.ts"
import { BuildAuthorizeUrlParameters } from "./PublicOAuth2ClientDefinitionSchemas.ts"

export interface Client {
  readonly buildAuthorizeUrl: (parameters: typeof BuildAuthorizeUrlParameters.Type) => Effect.Effect<
    string,
    InvalidUrlError | ParseError
  >
}

export const make = (options: { readonly authkitBaseURL: string }): Client => {
  return {
    buildAuthorizeUrl: (parameters) =>
      pipe(
        parameters,
        S.encode(BuildAuthorizeUrlParameters),
        Effect.flatMap((_) =>
          pipe(
            UrlParams.makeUrl(
              `${options.authkitBaseURL}/oauth2/authorize`,
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
