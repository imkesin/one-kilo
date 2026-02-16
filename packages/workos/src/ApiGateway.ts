import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Layer from "effect/Layer"
import * as ApiClient from "./ApiClient.ts"
import * as StoreDefinitions from "./internal/StoreDefinitions.ts"
import * as Store from "./Store.ts"

export interface Service {
  readonly client: StoreDefinitions.ApiClient
}

export class ApiGateway extends Context.Tag(
  "@effect/auth-workos/ApiGateway"
)<ApiGateway, Service>() {}

export const makeTest = (): Effect.Effect<Service, never, Store.Store> =>
  Effect.gen(function*() {
    const { apiClient } = yield* Store.Store

    return ApiGateway.of({
      client: {
        userManagement: apiClient.userManagement,
        organizations: apiClient.organizations
      }
    })
  })

export const layerTest = () => Layer.effect(ApiGateway, makeTest())

export const make = (): Effect.Effect<Service, never, ApiClient.ApiClient> =>
  Effect.gen(function*() {
    const { client } = yield* ApiClient.ApiClient

    return ApiGateway.of({
      client: {
        userManagement: {
          createUser: (parameters) =>
            pipe(
              client.userManagement.createUser(parameters),
              Effect.orDie
            ),
          updateUser: (userId, parameters) =>
            pipe(
              client.userManagement.updateUser(userId, parameters),
              Effect.orDie
            ),
          deleteUser: (userId) =>
            pipe(
              client.userManagement.deleteUser(userId),
              Effect.orDie
            ),
          retrieveUser: (userId) =>
            pipe(
              client.userManagement.retrieveUser(userId),
              Effect.catchTags({
                "RequestError": Effect.die,
                "ResponseError": Effect.die,
                "ParseError": Effect.die
              })
            ),

          createOrganizationMembership: (parameters) =>
            pipe(
              client.userManagement.createOrganizationMembership(parameters),
              Effect.orDie
            ),
          deleteOrganizationMembership: (organizationMembershipId) =>
            pipe(
              client.userManagement.deleteOrganizationMembership(organizationMembershipId),
              Effect.orDie
            )
        },
        organizations: {
          createOrganization: (parameters) =>
            pipe(
              client.organizations.createOrganization(parameters),
              Effect.orDie
            ),
          deleteOrganization: (organizationId) =>
            pipe(
              client.organizations.deleteOrganization(organizationId),
              Effect.orDie
            ),
          retrieveOrganization: (organizationId) =>
            pipe(
              client.organizations.retrieveOrganization(organizationId),
              Effect.catchTags({
                "RequestError": Effect.die,
                "ResponseError": Effect.die,
                "ParseError": Effect.die
              })
            )
        }
      }
    })
  })

export const layer = () => Layer.effect(ApiGateway, make())
