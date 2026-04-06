import * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as HttpClientResponse from "@effect/platform/HttpClientResponse"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import { Organization } from "../../domain/Entities.ts"
import * as WorkOSError from "../../domain/Errors.ts"
import type { OrganizationId } from "../../domain/Ids.ts"
import * as HttpResponseExtensions from "../http/HttpResponseExtensions.ts"
import * as SchemaExtensions from "../schema/SchemaExtensions.ts"
import { CreateOrganizationParameters, DeleteOrganizationOutcome } from "./OrganizationsApiClientDefinitionSchemas.ts"

export interface Client {
  readonly createOrganization: (
    parameters: typeof CreateOrganizationParameters.Type
  ) => Effect.Effect<Organization, WorkOSError.WorkOSCommonError>

  readonly retrieveOrganization: (
    organizationId: OrganizationId
  ) => Effect.Effect<Organization, WorkOSError.ResourceNotFoundError | WorkOSError.WorkOSCommonError>

  readonly deleteOrganization: (
    organizationId: OrganizationId
  ) => Effect.Effect<DeleteOrganizationOutcome, WorkOSError.WorkOSCommonError>
}

export const make = (httpClient: HttpClient.HttpClient): Client => {
  const mapResponse: <A, E>(
    f: (response: HttpClientResponse.HttpClientResponse) => Effect.Effect<A, E>
  ) => (
    request: HttpClientRequest.HttpClientRequest
  ) => Effect.Effect<A, WorkOSError.WorkOSCommonError | E> = (f) => (request) =>
    pipe(
      httpClient.execute(request),
      HttpResponseExtensions.catchNetworkErrors,
      Effect.flatMap((response) => f(response))
    )

  const flatMapResponse: <A, E1, E2>(
    f: (response: HttpClientResponse.HttpClientResponse) => Effect.Effect<A, E2>
  ) => (
    requestEffect: Effect.Effect<HttpClientRequest.HttpClientRequest, E1>
  ) => Effect.Effect<A, WorkOSError.WorkOSCommonError | E1 | E2> = (f) => (requestEffect) =>
    pipe(
      requestEffect,
      Effect.andThen(httpClient.execute),
      HttpResponseExtensions.catchNetworkErrors,
      Effect.flatMap((response) => f(response))
    )

  return {
    createOrganization: (parameters) =>
      pipe(
        parameters,
        SchemaExtensions.encodeCatching(CreateOrganizationParameters),
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
            "404": () => Effect.fail(new WorkOSError.ResourceNotFoundError()),
            orElse: HttpResponseExtensions.unexpectedStatus
          })
        )
      )
  }
}
