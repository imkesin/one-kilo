import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as HttpClientError from "effect/http/HttpClientError"
import * as HttpClientResponse from "effect/http/HttpClientResponse"
import * as Match from "effect/Match"
import type * as S from "effect/Schema"
import * as WorkOSError from "../../domain/Errors.ts"

const unexpectedResponseError = (reason: HttpClientError.ResponseError) =>
  WorkOSError.UnexpectedError.make({
    cause: reason,
    message: "Encountered an unexpected response error when executing a network request"
  })

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
          reason: Match.valueTags(e.reason, {
            "EncodeError": (reason) =>
              WorkOSError.HttpRequestError.make({
                reason: "Encode",
                description: reason.description
              }),
            "InvalidUrlError": (reason) =>
              WorkOSError.HttpRequestError.make({
                reason: "InvalidUrl",
                description: reason.description
              }),
            "TransportError": (reason) =>
              WorkOSError.HttpRequestError.make({
                reason: "Transport",
                description: reason.description
              }),
            /*
             * `HttpClient.execute` should never surface a response error (those originate from response-body decoding
             * helpers, handled by `decodeExpected`/`unexpectedStatus`). Kept here to satisfy exhaustiveness; reaching
             * these branches is truly unexpected.
             */
            "DecodeError": (reason) => unexpectedResponseError(reason),
            "EmptyBodyError": (reason) => unexpectedResponseError(reason),
            "StatusCodeError": (reason) => unexpectedResponseError(reason)
          })
        })
      )
  )

export const decodeExpected = <A, I>(schema: S.Codec<A, I>) => (response: HttpClientResponse.HttpClientResponse) =>
  pipe(
    response,
    HttpClientResponse.schemaBodyJson(schema),
    Effect.catchTags({
      "SchemaError": (e) =>
        WorkOSError.WorkOSCommonError.make({
          reason: WorkOSError.HttpResponseError.make({
            reason: "Decode",
            status: response.status,
            description: e.message
          })
        }),
      /*
       * `schemaBodyJson` raises `HttpClientError` when the body cannot be parsed as JSON at all (e.g. malformed
       * payload). Distinct from a schema-level `SchemaError`; treated as unexpected since a well-formed WorkOS
       * response should always be valid JSON.
       */
      "HttpClientError": (e) =>
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
