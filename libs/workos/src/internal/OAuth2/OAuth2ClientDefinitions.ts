import type * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientError from "@effect/platform/HttpClientError"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as HttpClientResponse from "@effect/platform/HttpClientResponse"
import * as UrlParams from "@effect/platform/UrlParams"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import type { ParseError } from "effect/ParseResult"
import * as Redacted from "effect/Redacted"
import * as Schedule from "effect/Schedule"
import * as S from "effect/Schema"
import { AccessToken } from "../../domain/DomainIds.ts"
import * as HttpResponseExtensions from "../../lib/HttpResponseExtensions.ts"

import {
  AuthorizeDeviceParameters,
  AuthorizeDeviceResponse,
  BuildAuthorizeUrlParameters,
  DeviceCodeAuthorizationTerminated,
  InvalidUrlError,
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
    HttpClientError.HttpClientError | ParseError
  >

  readonly buildAuthorizeUrl: (parameters: typeof BuildAuthorizeUrlParameters.Type) => Effect.Effect<
    string,
    InvalidUrlError | ParseError
  >

  readonly retrieveTokenByAuthorizationCode: (
    parameters: RetrieveTokenByAuthorizationCodeParameters_Redacted
  ) => Effect.Effect<
    typeof RetrieveTokenByAuthorizationCodeResponse.Type,
    HttpClientError.HttpClientError | ParseError
  >

  readonly retrieveTokenByRefreshToken: (
    parameters: RetrieveTokenByRefreshTokenParameters_Redacted
  ) => Effect.Effect<
    typeof RetrieveTokenByRefreshTokenResponse.Type,
    HttpClientError.HttpClientError | ParseError
  >

  readonly retrieveTokenByClientCredentials: (
    parameters: RetrieveTokenByClientCredentialsParameters_Redacted
  ) => Effect.Effect<
    typeof RetrieveTokenByClientCredentialsResponse.Type,
    HttpClientError.HttpClientError | ParseError
  >

  /**
   * Handles polling for the device code
   */
  readonly retrieveTokenByDeviceCode: (
    parameters: RetrieveTokenByDeviceCodeParameters_Redacted
  ) => Effect.Effect<
    typeof RetrieveTokenByDeviceCodeResponseSuccess.Type,
    DeviceCodeAuthorizationTerminated | HttpClientError.HttpClientError | ParseError
  >

  readonly retrieveUserInfo: (
    accessToken: AccessToken
  ) => Effect.Effect<
    typeof RetrieveUserInfoResponse.Type,
    HttpClientError.HttpClientError | ParseError
  >
}

export const make = (httpClient: HttpClient.HttpClient, options: { authKitPath: string }): Client => {
  const mapResponse: <A, E>(
    f: (response: HttpClientResponse.HttpClientResponse) => Effect.Effect<A, E>
  ) => (
    request: HttpClientRequest.HttpClientRequest
  ) => Effect.Effect<A, HttpClientError.HttpClientError | E> = (f) => (request) =>
    pipe(
      httpClient.execute(request),
      Effect.flatMap((response) => f(response))
    )

  const flatMapResponse: <A, E1, E2>(
    f: (response: HttpClientResponse.HttpClientResponse) => Effect.Effect<A, E2>
  ) => (
    requestEffect: Effect.Effect<HttpClientRequest.HttpClientRequest, E1>
  ) => Effect.Effect<A, HttpClientError.HttpClientError | E1 | E2> = (f) => (requestEffect) =>
    pipe(
      requestEffect,
      Effect.flatMap((request) => httpClient.execute(request)),
      Effect.flatMap((response) => f(response))
    )

  return {
    httpClient,
    authorizeDevice: (parameters) =>
      pipe(
        parameters,
        S.encode(AuthorizeDeviceParameters),
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
    buildAuthorizeUrl: (parameters) =>
      pipe(
        parameters,
        S.encode(BuildAuthorizeUrlParameters),
        Effect.flatMap((_) =>
          pipe(
            UrlParams.makeUrl(
              `${options.authKitPath}/oauth2/authorize`,
              UrlParams.fromInput(_),
              Option.none()
            ),
            Either.match({
              onLeft: (error) => Effect.fail(new InvalidUrlError({ cause: error })),
              onRight: (url) => Effect.succeed(url.toString())
            })
          )
        )
      ),
    retrieveTokenByAuthorizationCode: (parameters) =>
      pipe(
        {
          ...parameters,
          clientSecret: Redacted.value(parameters.clientSecret)
        },
        S.encode(RetrieveTokenByAuthorizationCodeParameters),
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
        S.encode(RetrieveTokenByRefreshTokenParameters),
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
        S.encode(RetrieveTokenByClientCredentialsParameters),
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
        S.encode(RetrieveTokenByDeviceCodeParameters),
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
        })
      )

      return pipe(
        pollingRequest,
        Effect.catchTags({
          "RetrieveTokenByDeviceCodeResponse.AuthorizationDeclined": () =>
            new DeviceCodeAuthorizationTerminated({
              deviceCode: parameters.deviceCode
            }),
          "RetrieveTokenByDeviceCodeResponse.AuthorizationPending": () =>
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
