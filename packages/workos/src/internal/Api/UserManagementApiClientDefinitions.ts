import * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientError from "@effect/platform/HttpClientError"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as HttpClientResponse from "@effect/platform/HttpClientResponse"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import type { ParseError } from "effect/ParseResult"
import * as Redacted from "effect/Redacted"
import * as S from "effect/Schema"
import { OrganizationMembership, User } from "../../domain/Entities.ts"
import { ResourceNotFoundError } from "../../domain/Errors.ts"
import type { EnvironmentClientId, OrganizationMembershipId, UserId } from "../../domain/Ids.ts"
import * as HttpResponseExtensions from "../../lib/HttpResponseExtensions.ts"
import {
  AuthenticateWithCodeParameters,
  AuthenticateWithCodeResponse,
  AuthenticateWithRefreshTokenParameters,
  AuthenticateWithRefreshTokenResponse,
  CreateOrganizationMembershipParameters,
  CreateUserParameters,
  DeleteOrganizationMembershipOutcome,
  DeleteUserOutcome,
  UpdateUserParameters
} from "./UserManagementApiClientDefinitionSchemas.ts"

type AuthenticateWithCodeParameters_WithoutClientFields = Omit<
  AuthenticateWithCodeParameters,
  "clientId" | "clientSecret"
>
type AuthenticateWithRefreshTokenParameters_WithoutClientFields = Omit<
  AuthenticateWithRefreshTokenParameters,
  "clientId" | "clientSecret"
>

export interface Client {
  readonly httpClient: HttpClient.HttpClient

  readonly authenticateWithCode: (parameters: AuthenticateWithCodeParameters_WithoutClientFields) => Effect.Effect<
    AuthenticateWithCodeResponse,
    HttpClientError.HttpClientError | ParseError
  >
  readonly authenticateWithRefreshToken: (
    parameters: AuthenticateWithRefreshTokenParameters_WithoutClientFields
  ) => Effect.Effect<
    AuthenticateWithRefreshTokenResponse,
    HttpClientError.HttpClientError | ParseError
  >

  readonly createUser: (parameters: typeof CreateUserParameters.Type) => Effect.Effect<
    User,
    HttpClientError.HttpClientError | ParseError
  >
  readonly updateUser: (userId: UserId, parameters: typeof UpdateUserParameters.Type) => Effect.Effect<
    User,
    HttpClientError.HttpClientError | ResourceNotFoundError | ParseError
  >
  readonly deleteUser: (userId: UserId) => Effect.Effect<DeleteUserOutcome, HttpClientError.HttpClientError>
  readonly retrieveUser: (userId: UserId) => Effect.Effect<
    User,
    HttpClientError.HttpClientError | ResourceNotFoundError | ParseError
  >

  readonly createOrganizationMembership: (
    parameters: typeof CreateOrganizationMembershipParameters.Type
  ) => Effect.Effect<OrganizationMembership, HttpClientError.HttpClientError | ParseError>

  readonly deleteOrganizationMembership: (
    organizationMembershipId: OrganizationMembershipId
  ) => Effect.Effect<DeleteOrganizationMembershipOutcome, HttpClientError.HttpClientError>
}

export const make = (
  httpClient: HttpClient.HttpClient,
  options: {
    readonly clientId: EnvironmentClientId
    readonly clientSecret: Redacted.Redacted<string>
  }
): Client => {
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
        {
          ...parameters,
          clientId: options.clientId,
          clientSecret: Redacted.value(options.clientSecret)
        },
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
    authenticateWithRefreshToken: (parameters) =>
      pipe(
        {
          ...parameters,
          clientId: options.clientId,
          clientSecret: Redacted.value(options.clientSecret)
        },
        S.encode(AuthenticateWithRefreshTokenParameters),
        Effect.map((_) =>
          pipe(
            HttpClientRequest.post("/authenticate"),
            HttpClientRequest.bodyUnsafeJson(_)
          )
        ),
        flatMapResponse(
          HttpClientResponse.matchStatus({
            "2xx": HttpResponseExtensions.decodeExpected(AuthenticateWithRefreshTokenResponse),
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
    updateUser: (userId, parameters) =>
      pipe(
        parameters,
        S.encode(UpdateUserParameters),
        Effect.map((_) =>
          pipe(
            HttpClientRequest.put(`/users/${userId}`),
            HttpClientRequest.bodyUnsafeJson(_)
          )
        ),
        flatMapResponse(
          HttpClientResponse.matchStatus({
            "2xx": HttpResponseExtensions.decodeExpected(User),
            "404": () => Effect.fail(new ResourceNotFoundError()),
            orElse: HttpResponseExtensions.unexpectedStatus
          })
        )
      ),
    deleteUser: (userId) =>
      pipe(
        HttpClientRequest.del(`/users/${userId}`),
        mapResponse(
          HttpClientResponse.matchStatus({
            "2xx": () => Effect.succeed(DeleteUserOutcome.Success()),
            "404": () => Effect.succeed(DeleteUserOutcome.NotFound()),
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
      ),

    createOrganizationMembership: (parameters) =>
      pipe(
        parameters,
        S.encode(CreateOrganizationMembershipParameters),
        Effect.map((_) =>
          pipe(
            HttpClientRequest.post("/organization_memberships"),
            HttpClientRequest.bodyUnsafeJson(_)
          )
        ),
        flatMapResponse(
          HttpClientResponse.matchStatus({
            "2xx": HttpResponseExtensions.decodeExpected(OrganizationMembership),
            orElse: HttpResponseExtensions.unexpectedStatus
          })
        )
      ),
    deleteOrganizationMembership: (organizationMembershipId) =>
      pipe(
        HttpClientRequest.del(`/organization_memberships/${organizationMembershipId}`),
        mapResponse(
          HttpClientResponse.matchStatus({
            "2xx": () => Effect.succeed(DeleteOrganizationMembershipOutcome.Success()),
            "404": () => Effect.succeed(DeleteOrganizationMembershipOutcome.NotFound()),
            orElse: HttpResponseExtensions.unexpectedStatus
          })
        )
      )
  }
}
