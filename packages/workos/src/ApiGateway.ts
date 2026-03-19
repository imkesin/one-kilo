import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as ApiClient from "./ApiClient.ts"
import * as StoreDefinitions from "./internal/StoreDefinitions.ts"
import * as Store from "./Store.ts"

export type Service = StoreDefinitions.ApiClient

export class ApiGateway extends Context.Tag(
  "@effect/auth-workos/ApiGateway"
)<ApiGateway, Service>() {}

export const makeTest = (): Effect.Effect<Service, never, Store.Store> =>
  Effect.gen(function*() {
    const { apiClient } = yield* Store.Store

    return ApiGateway.of({
      userManagement: apiClient.userManagement,
      organizations: apiClient.organizations
    })
  })

export const layerTest = () => Layer.effect(ApiGateway, makeTest())

export const make = (): Effect.Effect<Service, never, ApiClient.ApiClient> =>
  Effect.gen(function*() {
    const client = yield* ApiClient.ApiClient

    return ApiGateway.of({
      userManagement: {
        createUser: (parameters) => client.userManagement.createUser(parameters),
        retrieveUser: (userId) => client.userManagement.retrieveUser(userId),
        updateUser: (userId, parameters) => client.userManagement.updateUser(userId, parameters),
        deleteUser: (userId) => client.userManagement.deleteUser(userId),

        createOrganizationMembership: (parameters) => client.userManagement.createOrganizationMembership(parameters),
        deleteOrganizationMembership: (organizationMembershipId) =>
          client.userManagement.deleteOrganizationMembership(organizationMembershipId)
      },
      organizations: {
        createOrganization: (parameters) => client.organizations.createOrganization(parameters),
        retrieveOrganization: (organizationId) => client.organizations.retrieveOrganization(organizationId),
        deleteOrganization: (organizationId) => client.organizations.deleteOrganization(organizationId)
      }
    })
  })

export const layer = () => Layer.effect(ApiGateway, make())
