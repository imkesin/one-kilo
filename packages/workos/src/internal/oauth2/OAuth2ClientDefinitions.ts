import type * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as HttpClientResponse from "@effect/platform/HttpClientResponse"
import * as UrlParams from "@effect/platform/UrlParams"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Redacted from "effect/Redacted"
import * as Schedule from "effect/Schedule"
import * as S from "effect/Schema"
import * as WorkOSError from "../../domain/Errors.ts"
import { AccessToken } from "../../domain/Values.ts"
import * as HttpResponseExtensions from "../http/HttpResponseExtensions.ts"
import * as SchemaExtensions from "../schema/SchemaExtensions.ts"
import {
  AuthorizeDeviceParameters,
  AuthorizeDeviceResponse,
  DeviceCodeAuthorizationTerminated,
  RetrieveTokenByAuthorizationCodeParameters,
  type RetrieveTokenByAuthorizationCodeParameters_Redacted,
  RetrieveTokenByAuthorizationCodeResponse,
  RetrieveTokenByClientCredentialsParameters,
  type RetrieveTokenByClientCredentialsParameters_Redacted,
  RetrieveTokenByClientCredentialsResponse,
  RetrieveTokenByDeviceCodeParameters,
  type RetrieveTokenByDeviceCodeParameters_Redacted,
  RetrieveTokenByDeviceCodeResponseAuthorizationDeclined,
  RetrieveTokenByDeviceCodeResponseAuthorizationPending,
  RetrieveTokenByDeviceCodeResponseSuccess,
  RetrieveTokenByRefreshTokenParameters,
  type RetrieveTokenByRefreshTokenParameters_Redacted,
  RetrieveTokenByRefreshTokenResponse,
  RetrieveUserInfoResponse
} from "./OAuth2ClientDefinitionSchemas.ts"

export interface Client {
  readonly httpClient: HttpClient.HttpClient

  readonly authorizeDevice: (
    parameters: typeof AuthorizeDeviceParameters.Type
  ) => Effect.Effect<
    typeof AuthorizeDeviceResponse.Type,
    WorkOSError.WorkOSError
  >

  readonly retrieveTokenByAuthorizationCode: (
    parameters: RetrieveTokenByAuthorizationCodeParameters_Redacted
  ) => Effect.Effect<
    typeof RetrieveTokenByAuthorizationCodeResponse.Type,
    WorkOSError.WorkOSError
  >

  readonly retrieveTokenByRefreshToken: (
    parameters: RetrieveTokenByRefreshTokenParameters_Redacted
  ) => Effect.Effect<
    typeof RetrieveTokenByRefreshTokenResponse.Type,
    WorkOSError.WorkOSError
  >

  readonly retrieveTokenByClientCredentials: (
    parameters: RetrieveTokenByClientCredentialsParameters_Redacted
  ) => Effect.Effect<
    typeof RetrieveTokenByClientCredentialsResponse.Type,
    WorkOSError.WorkOSError
  >

  /**
   * Handles polling for the device code
   */
  readonly retrieveTokenByDeviceCode: (
    parameters: RetrieveTokenByDeviceCodeParameters_Redacted
  ) => Effect.Effect<
    typeof RetrieveTokenByDeviceCodeResponseSuccess.Type,
    DeviceCodeAuthorizationTerminated | WorkOSError.WorkOSError
  >

  readonly retrieveUserInfo: (
    accessToken: AccessToken
  ) => Effect.Effect<
    typeof RetrieveUserInfoResponse.Type,
    WorkOSError.WorkOSError
  >
}

export const make = (httpClient: HttpClient.HttpClient): Client => {
  const mapResponse: <A, E>(
    f: (response: HttpClientResponse.HttpClientResponse) => Effect.Effect<A, E>
  ) => (
    request: HttpClientRequest.HttpClientRequest
  ) => Effect.Effect<A, WorkOSError.WorkOSError | E> = (f) => (request) =>
    pipe(
      httpClient.execute(request),
      HttpResponseExtensions.catchNetworkErrors,
      Effect.flatMap((response) => f(response))
    )

  const flatMapResponse: <A, E1, E2>(
    f: (response: HttpClientResponse.HttpClientResponse) => Effect.Effect<A, E2>
  ) => (
    requestEffect: Effect.Effect<HttpClientRequest.HttpClientRequest, E1>
  ) => Effect.Effect<A, WorkOSError.WorkOSError | E1 | E2> = (f) => (requestEffect) =>
    pipe(
      requestEffect,
      Effect.flatMap((request) => httpClient.execute(request)),
      HttpResponseExtensions.catchNetworkErrors,
      Effect.flatMap((response) => f(response))
    )

  return {
    httpClient,
    authorizeDevice: (parameters) =>
      pipe(
        parameters,
        SchemaExtensions.encodeCatching(AuthorizeDeviceParameters),
        Effect.map((_) =>
          pipe(
            HttpClientRequest.post("/oauth2/device_authorization"),
            HttpClientRequest.bodyUrlParams(UrlParams.fromInput(_))
          )
        ),
        flatMapResponse(
          HttpClientResponse.matchStatus({
            "2xx": HttpResponseExtensions.decodeExpected(AuthorizeDeviceResponse),
            orElse: HttpResponseExtensions.unexpectedStatus
          })
        )
      ),
    retrieveTokenByAuthorizationCode: (parameters) =>
      pipe(
        {
          ...parameters,
          clientSecret: Redacted.value(parameters.clientSecret)
        },
        SchemaExtensions.encodeCatching(RetrieveTokenByAuthorizationCodeParameters),
        Effect.map((_) =>
          pipe(
            HttpClientRequest.post("/oauth2/token"),
            HttpClientRequest.bodyUrlParams(UrlParams.fromInput(_))
          )
        ),
        flatMapResponse(
          HttpClientResponse.matchStatus({
            "2xx": HttpResponseExtensions.decodeExpected(RetrieveTokenByAuthorizationCodeResponse),
            orElse: HttpResponseExtensions.unexpectedStatus
          })
        )
      ),
    retrieveTokenByRefreshToken: (parameters) =>
      pipe(
        {
          ...parameters,
          clientSecret: Redacted.value(parameters.clientSecret)
        },
        SchemaExtensions.encodeCatching(RetrieveTokenByRefreshTokenParameters),
        Effect.map((_) =>
          pipe(
            HttpClientRequest.post("/oauth2/token"),
            HttpClientRequest.bodyUrlParams(UrlParams.fromInput(_))
          )
        ),
        flatMapResponse(
          HttpClientResponse.matchStatus({
            "2xx": HttpResponseExtensions.decodeExpected(RetrieveTokenByRefreshTokenResponse),
            orElse: HttpResponseExtensions.unexpectedStatus
          })
        )
      ),
    retrieveTokenByClientCredentials: (parameters) =>
      pipe(
        {
          ...parameters,
          clientSecret: Redacted.value(parameters.clientSecret)
        },
        SchemaExtensions.encodeCatching(RetrieveTokenByClientCredentialsParameters),
        Effect.map((_) =>
          pipe(
            HttpClientRequest.post("/oauth2/token"),
            HttpClientRequest.bodyUrlParams(UrlParams.fromInput(_))
          )
        ),
        flatMapResponse(
          HttpClientResponse.matchStatus({
            "2xx": HttpResponseExtensions.decodeExpected(RetrieveTokenByClientCredentialsResponse),
            orElse: HttpResponseExtensions.unexpectedStatus
          })
        )
      ),
    retrieveTokenByDeviceCode: (parameters) => {
      const request = pipe(
        {
          ...parameters,
          clientSecret: Redacted.value(parameters.clientSecret)
        },
        SchemaExtensions.encodeCatching(RetrieveTokenByDeviceCodeParameters),
        Effect.map((_) =>
          pipe(
            HttpClientRequest.post("/oauth2/token"),
            HttpClientRequest.bodyUrlParams(UrlParams.fromInput(_))
          )
        ),
        flatMapResponse(
          HttpClientResponse.matchStatus({
            "2xx": HttpResponseExtensions.decodeExpected(RetrieveTokenByDeviceCodeResponseSuccess),
            "4xx": HttpResponseExtensions.decodeExpected(
              S.Union(
                RetrieveTokenByDeviceCodeResponseAuthorizationPending,
                RetrieveTokenByDeviceCodeResponseAuthorizationDeclined
              )
            ),
            orElse: HttpResponseExtensions.unexpectedStatus
          })
        ),
        Effect.flatMap((response) => {
          if (response._tag === "RetrieveTokenByDeviceCodeResponse.Success") {
            return Effect.succeed(response)
          }

          return Effect.fail(response)
        })
      )

      const pollingRequest = pipe(
        request,
        Effect.retry({
          schedule: Schedule.spaced("5 seconds"),
          while: (response) => response._tag === "RetrieveTokenByDeviceCodeResponse.AuthorizationPending"
        }),
        Effect.catchTag(
          "RetrieveTokenByDeviceCodeResponse.AuthorizationPending",
          () => Effect.die("An impossible state was reached. Authorization is still pending, but we stopped polling")
        )
      )

      return pipe(
        pollingRequest,
        Effect.catchTags({
          "RetrieveTokenByDeviceCodeResponse.AuthorizationDeclined": () =>
            new DeviceCodeAuthorizationTerminated({
              deviceCode: parameters.deviceCode
            })
        })
      )
    },
    retrieveUserInfo: (accessToken) =>
      pipe(
        HttpClientRequest.post("/oauth2/userinfo"),
        HttpClientRequest.bearerToken(accessToken),
        mapResponse(
          HttpClientResponse.matchStatus({
            "2xx": HttpResponseExtensions.decodeExpected(RetrieveUserInfoResponse),
            orElse: HttpResponseExtensions.unexpectedStatus
          })
        )
      )
  }
}
