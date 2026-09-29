import * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as Config from "effect/Config"
import type { ConfigError } from "effect/ConfigError"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import type * as Redacted from "effect/Redacted"
import { UnexpectedError, WorkOSCommonError } from "./domain/Errors.ts"
import type { EnvironmentClientId } from "./domain/Ids.ts"
import * as EventsClientDefinitions from "./internal/api/EventsApiClientDefinitions.ts"
import * as OrganizationsClientDefinitions from "./internal/api/OrganizationsApiClientDefinitions.ts"
import * as UserManagementClientDefinitions from "./internal/api/UserManagementApiClientDefinitions.ts"

export interface Service {
  readonly events: EventsClientDefinitions.Client
  readonly organizations: OrganizationsClientDefinitions.Client
  readonly userManagement: UserManagementClientDefinitions.Client
}

export class ApiClient extends Context.Tag(
  "@effect/auth-workos/ApiClient"
)<ApiClient, Service>() {}

export const makeNotImplemented = (): Service => {
  const failWithNotImplementedError = (methodName: string) => () =>
    Effect.fail(
      WorkOSCommonError.make({
        reason: UnexpectedError.make({
          message: `\`${methodName}\` is intentionally not implemented`
        })
      })
    )

  return ApiClient.of({
    events: {
      listEvents: failWithNotImplementedError("listEvents")
    },
    organizations: {
      createOrganization: failWithNotImplementedError("createOrganization"),
      deleteOrganization: failWithNotImplementedError("deleteOrganization"),
      retrieveOrganization: failWithNotImplementedError("retrieveOrganization")
    },
    userManagement: {
      authenticateWithCode: failWithNotImplementedError("authenticateWithCode"),
      authenticateWithRefreshToken: failWithNotImplementedError("authenticateWithRefreshToken"),
      createOrganizationMembership: failWithNotImplementedError("createOrganizationMembership"),
      createUser: failWithNotImplementedError("createUser"),
      deleteOrganizationMembership: failWithNotImplementedError("deleteOrganizationMembership"),
      deleteUser: failWithNotImplementedError("deleteUser"),
      retrieveUser: failWithNotImplementedError("retrieveUser"),
      updateUser: failWithNotImplementedError("updateUser")
    }
  })
}

/**
 * Intended to be used in tests
 */
export const layerNotImplemented = (): Layer.Layer<ApiClient> => Layer.succeed(ApiClient, makeNotImplemented())

export const make = (
  options: {
    /**
     * The WorkOS Environment-Specific Client ID
     */
    readonly clientId: EnvironmentClientId
    /**
     * The WorkOS API Key
     */
    readonly clientSecret: Redacted.Redacted<string>
  }
): Effect.Effect<Service, never, HttpClient.HttpClient> =>
  Effect.gen(function*() {
    const apiPath = "https://api.workos.com"

    const baseHttpClient = yield* pipe(
      HttpClient.HttpClient,
      Effect.map(
        HttpClient.mapRequest(
          HttpClientRequest.bearerToken(options.clientSecret)
        )
      )
    )
    const eventsHttpClient = HttpClient.mapRequest(
      baseHttpClient,
      HttpClientRequest.prependUrl(`${apiPath}/events`)
    )
    const organizationsHttpClient = HttpClient.mapRequest(
      baseHttpClient,
      HttpClientRequest.prependUrl(`${apiPath}/organizations`)
    )
    const userManagementHttpClient = HttpClient.mapRequest(
      baseHttpClient,
      HttpClientRequest.prependUrl(`${apiPath}/user_management`)
    )

    return ApiClient.of({
      events: EventsClientDefinitions.make(eventsHttpClient),
      organizations: OrganizationsClientDefinitions.make(organizationsHttpClient),
      userManagement: UserManagementClientDefinitions.make(userManagementHttpClient, options)
    })
  })

export const layer = (
  options: {
    readonly clientId: EnvironmentClientId
    readonly clientSecret: Redacted.Redacted<string>
  }
): Layer.Layer<ApiClient, never, HttpClient.HttpClient> => Layer.effect(ApiClient, make(options))

export const layerConfig = (
  options: {
    readonly clientId: Config.Config<EnvironmentClientId>
    readonly clientSecret: Config.Config<Redacted.Redacted<string>>
  }
): Layer.Layer<ApiClient, ConfigError, HttpClient.HttpClient> => {
  return pipe(
    Config.all(options),
    Effect.flatMap((configs) => make(configs)),
    Layer.effect(ApiClient)
  )
}
