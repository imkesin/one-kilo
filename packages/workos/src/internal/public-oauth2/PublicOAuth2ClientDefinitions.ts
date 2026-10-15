import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Url from "effect/http/Url"
import * as UrlParams from "effect/http/UrlParams"
import * as Result from "effect/Result"
import * as WorkOSError from "../../domain/Errors.ts"
import { encodeCatching } from "../schema/SchemaExtensions.ts"
import { BuildAuthorizeUrlParameters } from "./PublicOAuth2ClientDefinitionSchemas.ts"

export interface Client {
  readonly buildAuthorizeUrl: (parameters: BuildAuthorizeUrlParameters) => Effect.Effect<
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
            Url.make(
              `${options.authkitBaseURL}/oauth2/authorize`,
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
