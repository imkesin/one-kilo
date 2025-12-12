import * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientError from "@effect/platform/HttpClientError"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as HttpClientResponse from "@effect/platform/HttpClientResponse"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import type { ParseError } from "effect/ParseResult"
import * as S from "effect/Schema"
import { User } from "../../domain/DomainEntities.ts"
import { ResourceNotFoundError } from "../../domain/DomainErrors.ts"
import type { UserId } from "../../domain/DomainIds.ts"
import * as HttpResponseExtensions from "../../lib/HttpResponseExtensions.ts"
import {
  AuthenticateWithCodeParameters,
  AuthenticateWithCodeResponse,
  CreateUserParameters
} from "./ApiClientDefinitionSchemas.ts"

export interface Client {
  readonly httpClient: HttpClient.HttpClient

  readonly authenticateWithCode: (parameters: AuthenticateWithCodeParameters) => Effect.Effect<
    AuthenticateWithCodeResponse,
    HttpClientError.HttpClientError | ParseError
  >

  readonly createUser: (parameters: typeof CreateUserParameters.Type) => Effect.Effect<
    User,
    HttpClientError.HttpClientError | ParseError
  >
  readonly retrieveUser: (userId: UserId) => Effect.Effect<
    User,
    HttpClientError.HttpClientError | ResourceNotFoundError | ParseError
  >
}

export const make = (httpClient: HttpClient.HttpClient): Client => {
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

    authenticateWithCode: (parameters) =>
      pipe(
        parameters,
        S.encode(AuthenticateWithCodeParameters),
        Effect.map((_) =>
          pipe(
            HttpClientRequest.post("/authenticate"),
            HttpClientRequest.bodyUnsafeJson(_)
          )
        ),
        flatMapResponse(
          HttpClientResponse.matchStatus({
            "2xx": HttpResponseExtensions.decodeExpected(AuthenticateWithCodeResponse),
            orElse: HttpResponseExtensions.unexpectedStatus
          })
        )
      ),

    createUser: (parameters) =>
      pipe(
        parameters,
        S.encode(CreateUserParameters),
        Effect.map((_) =>
          pipe(
            HttpClientRequest.post("/users"),
            HttpClientRequest.bodyUnsafeJson(_)
          )
        ),
        flatMapResponse(
          HttpClientResponse.matchStatus({
            "2xx": HttpResponseExtensions.decodeExpected(User),
            orElse: HttpResponseExtensions.unexpectedStatus
          })
        )
      ),
    retrieveUser: (userId) =>
      pipe(
        HttpClientRequest.get(`/users/${userId}`),
        mapResponse(
          HttpClientResponse.matchStatus({
            "2xx": HttpResponseExtensions.decodeExpected(User),
            "404": () => Effect.fail(new ResourceNotFoundError()),
            orElse: HttpResponseExtensions.unexpectedStatus
          })
        )
      )
  }
}
