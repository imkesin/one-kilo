import * as HttpClientError from "@effect/platform/HttpClientError"
import * as HttpClientResponse from "@effect/platform/HttpClientResponse"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Match from "effect/Match"
import type * as S from "effect/Schema"
import * as WorkOSError from "../../domain/Errors.ts"

/**
 * Intended to handle network (and general outbound) errors from `HttpClient.execute`
 */
export const catchNetworkErrors = <A, E>(
  effect: Effect.Effect<A, E | HttpClientError.HttpClientError>
) =>
  Effect.catchIf(
    effect,
    HttpClientError.isHttpClientError,
    (e) =>
      Effect.fail(
        WorkOSError.WorkOSCommonError.make({
          reason: Match.valueTags(e, {
            "RequestError": (e) =>
              WorkOSError.HttpRequestError.make({
                reason: e.reason,
                description: e.description
              }),
            /*
             * `HttpClient.execute` should never surface a `ResponseError` (those originate from response-body decoding
             * helpers, handled by `decodeExpected`/`unexpectedStatus`). Kept here to satisfy exhaustiveness; reaching
             * this branch is truly unexpected.
             */
            "ResponseError": (e) =>
              WorkOSError.UnexpectedError.make({
                cause: e,
                message: "Encountered an unexpected response error when executing a network request"
              })
          })
        })
      )
  )

export const decodeExpected =
  <A, I, R>(schema: S.Schema<A, I, R>) => (response: HttpClientResponse.HttpClientResponse) =>
    pipe(
      response,
      HttpClientResponse.schemaBodyJson(schema),
      Effect.catchTags({
        "ParseError": (e) =>
          WorkOSError.WorkOSCommonError.make({
            reason: WorkOSError.HttpResponseError.make({
              reason: "Decode",
              status: response.status,
              description: e.message
            })
          }),
        /*
         * `schemaBodyJson` raises `ResponseError` when the body cannot be parsed as JSON at all (e.g. malformed
         * payload). Distinct from a schema-level `ParseError`; treated as unexpected since a well-formed WorkOS
         * response should always be valid JSON.
         */
        "ResponseError": (e) =>
          WorkOSError.WorkOSCommonError.make({
            reason: WorkOSError.UnexpectedError.make({
              cause: e,
              message: "Failed to parse response body as JSON"
            })
          })
      })
    )

export const unexpectedStatus = (response: HttpClientResponse.HttpClientResponse) =>
  Effect.flatMap(
    Effect.orElseSucceed(response.json, () => "Unexpected status code"),
    (description) =>
      Effect.fail(
        WorkOSError.WorkOSCommonError.make({
          reason: WorkOSError.HttpResponseError.make({
            reason: "StatusCode",
            status: response.status,
            description: typeof description === "string" ? description : JSON.stringify(description)
          })
        })
      )
  )
