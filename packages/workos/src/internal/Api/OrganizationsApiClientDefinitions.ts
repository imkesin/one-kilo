import * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientError from "@effect/platform/HttpClientError"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as HttpClientResponse from "@effect/platform/HttpClientResponse"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import type { ParseError } from "effect/ParseResult"
import * as S from "effect/Schema"
import { Organization } from "../../domain/Entities.ts"
import { ResourceNotFoundError } from "../../domain/Errors.ts"
import type { OrganizationId } from "../../domain/Ids.ts"
import * as HttpResponseExtensions from "../../lib/HttpResponseExtensions.ts"
import { CreateOrganizationParameters, DeleteOrganizationOutcome } from "./OrganizationsApiClientDefinitionSchemas.ts"

export interface Client {
  readonly httpClient: HttpClient.HttpClient

  readonly createOrganization: (
    parameters: typeof CreateOrganizationParameters.Type
  ) => Effect.Effect<Organization, HttpClientError.HttpClientError | ParseError>

  readonly deleteOrganization: (
    organizationId: OrganizationId
  ) => Effect.Effect<DeleteOrganizationOutcome, HttpClientError.HttpClientError>

  readonly retrieveOrganization: (
    organizationId: OrganizationId
  ) => Effect.Effect<Organization, HttpClientError.HttpClientError | ResourceNotFoundError | ParseError>
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

    createOrganization: (parameters) =>
      pipe(
        parameters,
        S.encode(CreateOrganizationParameters),
        Effect.map((_) =>
          pipe(
            HttpClientRequest.post("/"),
            HttpClientRequest.bodyUnsafeJson(_)
          )
        ),
        flatMapResponse(
          HttpClientResponse.matchStatus({
            "2xx": HttpResponseExtensions.decodeExpected(Organization),
            orElse: HttpResponseExtensions.unexpectedStatus
          })
        )
      ),
    deleteOrganization: (organizationId) =>
      pipe(
        HttpClientRequest.del(`/${organizationId}`),
        mapResponse(
          HttpClientResponse.matchStatus({
            "2xx": () => Effect.succeed(DeleteOrganizationOutcome.Success()),
            "404": () => Effect.succeed(DeleteOrganizationOutcome.NotFound()),
            orElse: HttpResponseExtensions.unexpectedStatus
          })
        )
      ),
    retrieveOrganization: (organizationId) =>
      pipe(
        HttpClientRequest.get(`/${organizationId}`),
        mapResponse(
          HttpClientResponse.matchStatus({
            "2xx": HttpResponseExtensions.decodeExpected(Organization),
            "404": () => Effect.fail(new ResourceNotFoundError()),
            orElse: HttpResponseExtensions.unexpectedStatus
          })
        )
      )
  }
}
