import * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as HttpClientResponse from "@effect/platform/HttpClientResponse"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Redacted from "effect/Redacted"
import { OrganizationMembership, User } from "../../domain/Entities.ts"
import * as WorkOSError from "../../domain/Errors.ts"
import type { EnvironmentClientId, OrganizationMembershipId, UserId } from "../../domain/Ids.ts"
import * as HttpResponseExtensions from "../http/HttpResponseExtensions.ts"
import * as SchemaExtensions from "../schema/SchemaExtensions.ts"
import {
  AuthenticateWithCodeError,
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
  readonly authenticateWithCode: (parameters: AuthenticateWithCodeParameters_WithoutClientFields) => Effect.Effect<
    AuthenticateWithCodeResponse,
    WorkOSError.InvalidAuthenticationCodeError | WorkOSError.WorkOSCommonError
  >

  readonly authenticateWithRefreshToken: (
    parameters: AuthenticateWithRefreshTokenParameters_WithoutClientFields
  ) => Effect.Effect<
    AuthenticateWithRefreshTokenResponse,
    WorkOSError.InvalidRefreshTokenError | WorkOSError.WorkOSCommonError
  >

  readonly createUser: (parameters: typeof CreateUserParameters.Type) => Effect.Effect<
    User,
    WorkOSError.WorkOSCommonError
  >

  readonly retrieveUser: (userId: UserId) => Effect.Effect<
    User,
    WorkOSError.ResourceNotFoundError | WorkOSError.WorkOSCommonError
  >

  readonly updateUser: (userId: UserId, parameters: typeof UpdateUserParameters.Type) => Effect.Effect<
    User,
    WorkOSError.ResourceNotFoundError | WorkOSError.WorkOSCommonError
  >

  readonly deleteUser: (userId: UserId) => Effect.Effect<
    DeleteUserOutcome,
    WorkOSError.WorkOSCommonError
  >

  readonly createOrganizationMembership: (
    parameters: typeof CreateOrganizationMembershipParameters.Type
  ) => Effect.Effect<OrganizationMembership, WorkOSError.WorkOSCommonError>

  readonly deleteOrganizationMembership: (
    organizationMembershipId: OrganizationMembershipId
  ) => Effect.Effect<DeleteOrganizationMembershipOutcome, WorkOSError.WorkOSCommonError>
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
    authenticateWithCode: (parameters) =>
      pipe(
        {
          ...parameters,
          clientId: options.clientId,
          clientSecret: Redacted.value(options.clientSecret)
        },
        SchemaExtensions.encodeCatching(AuthenticateWithCodeParameters),
        Effect.map((_) =>
          pipe(
            HttpClientRequest.post("/authenticate"),
            HttpClientRequest.bodyUnsafeJson(_)
          )
        ),
        flatMapResponse(
          HttpClientResponse.matchStatus({
            "2xx": HttpResponseExtensions.decodeExpected(AuthenticateWithCodeResponse),
            "400": (response) =>
              pipe(
                response,
                HttpClientResponse.schemaBodyJson(AuthenticateWithCodeError.InvalidGrant),
                Effect.flatMap(() => new WorkOSError.InvalidAuthenticationCodeError({ code: parameters.code })),
                Effect.catchTags({
                  "ParseError": () => HttpResponseExtensions.unexpectedStatus(response),
                  "ResponseError": () => HttpResponseExtensions.unexpectedStatus(response)
                })
              ),
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
        SchemaExtensions.encodeCatching(AuthenticateWithRefreshTokenParameters),
        Effect.map((_) =>
          pipe(
            HttpClientRequest.post("/authenticate"),
            HttpClientRequest.bodyUnsafeJson(_)
          )
        ),
        flatMapResponse(
          HttpClientResponse.matchStatus({
            "2xx": HttpResponseExtensions.decodeExpected(AuthenticateWithRefreshTokenResponse),
            "400": (response) =>
              pipe(
                response,
                HttpClientResponse.schemaBodyJson(AuthenticateWithCodeError.InvalidGrant),
                Effect.flatMap(() =>
                  new WorkOSError.InvalidRefreshTokenError({ refreshToken: parameters.refreshToken })
                ),
                Effect.catchTags({
                  "ParseError": () => HttpResponseExtensions.unexpectedStatus(response),
                  "ResponseError": () => HttpResponseExtensions.unexpectedStatus(response)
                })
              ),
            orElse: HttpResponseExtensions.unexpectedStatus
          })
        )
      ),

    createUser: (parameters) =>
      pipe(
        parameters,
        SchemaExtensions.encodeCatching(CreateUserParameters),
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
            "404": () => Effect.fail(new WorkOSError.ResourceNotFoundError()),
            orElse: HttpResponseExtensions.unexpectedStatus
          })
        )
      ),
    updateUser: (userId, parameters) =>
      pipe(
        parameters,
        SchemaExtensions.encodeCatching(UpdateUserParameters),
        Effect.map((_) =>
          pipe(
            HttpClientRequest.put(`/users/${userId}`),
            HttpClientRequest.bodyUnsafeJson(_)
          )
        ),
        flatMapResponse(
          HttpClientResponse.matchStatus({
            "2xx": HttpResponseExtensions.decodeExpected(User),
            "404": () => Effect.fail(new WorkOSError.ResourceNotFoundError()),
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

    createOrganizationMembership: (parameters) =>
      pipe(
        parameters,
        SchemaExtensions.encodeCatching(CreateOrganizationMembershipParameters),
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
