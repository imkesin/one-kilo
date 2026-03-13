import * as HttpClientError from "@effect/platform/HttpClientError"
import * as HttpClientResponse from "@effect/platform/HttpClientResponse"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as WorkOSError from "../../domain/Errors.ts"

export const catchNetworkErrors = <A, E>(
  effect: Effect.Effect<A, E | HttpClientError.HttpClientError>
) =>
  pipe(
    effect,
    Effect.catchTag("RequestError", (e) =>
      Effect.fail(
        new WorkOSError.WorkOSCommonError({
          reason: new WorkOSError.HttpRequestError({ cause: e })
        })
      )),
    Effect.catchTag("ResponseError", (e) =>
      Effect.fail(
        new WorkOSError.WorkOSCommonError({
          reason: new WorkOSError.HttpResponseError({ cause: e })
        })
      ))
  )

export const decodeExpected =
  <A, I, R>(schema: S.Schema<A, I, R>) => (response: HttpClientResponse.HttpClientResponse) =>
    pipe(
      response,
      HttpClientResponse.schemaBodyJson(schema),
      Effect.catchTags({
        "ParseError": (e) =>
          new WorkOSError.WorkOSCommonError({
            reason: new WorkOSError.UnexpectedError({
              cause: e,
              message: "Failed to decode response body"
            })
          }),
        "ResponseError": (e) =>
          new WorkOSError.WorkOSCommonError({
            reason: new WorkOSError.HttpResponseError({ cause: e })
          })
      })
    )

export const unexpectedStatus = (response: HttpClientResponse.HttpClientResponse) =>
  Effect.flatMap(
    Effect.orElseSucceed(response.json, () => "Unexpected status code"),
    (description) =>
      Effect.fail(
        new WorkOSError.WorkOSCommonError({
          reason: new WorkOSError.HttpResponseError({
            cause: new HttpClientError.ResponseError({
              request: response.request,
              response,
              reason: "StatusCode",
              description: typeof description === "string" ? description : JSON.stringify(description)
            })
          })
        })
      )
  )
