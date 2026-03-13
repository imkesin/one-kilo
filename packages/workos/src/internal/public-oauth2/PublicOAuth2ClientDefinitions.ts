import * as UrlParams from "@effect/platform/UrlParams"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as WorkOSError from "../../domain/Errors.ts"
import { encodeCatching } from "../schema/SchemaExtensions.ts"
import { BuildAuthorizeUrlParameters } from "./PublicOAuth2ClientDefinitionSchemas.ts"

export interface Client {
  readonly buildAuthorizeUrl: (parameters: typeof BuildAuthorizeUrlParameters.Type) => Effect.Effect<
    string,
    WorkOSError.WorkOSCommonError
  >
}

export const make = (options: { readonly authkitBaseURL: string }): Client => {
  return {
    buildAuthorizeUrl: (parameters) =>
      pipe(
        parameters,
        encodeCatching(BuildAuthorizeUrlParameters),
        Effect.flatMap((_) =>
          pipe(
            UrlParams.makeUrl(
              `${options.authkitBaseURL}/oauth2/authorize`,
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
