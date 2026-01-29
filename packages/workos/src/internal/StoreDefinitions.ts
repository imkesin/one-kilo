import * as KeyValueStore from "@effect/platform/KeyValueStore"
import * as Arr from "effect/Array"
import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as HashMap from "effect/HashMap"
import * as Option from "effect/Option"
import * as Redacted from "effect/Redacted"
import * as S from "effect/Schema"
import { Organization, OrganizationMembership, User } from "../domain/Entities.ts"
import { ResourceNotFoundError, UnauthorizedError } from "../domain/Errors.ts"
import {
  ClientId,
  generateOrganizationId,
  generateOrganizationMembershipId,
  generateUserId,
  OrganizationId,
  OrganizationMembershipId,
  UserId
} from "../domain/Ids.ts"
import { EmailAddress, OrganizationMembershipStatus, Role } from "../domain/Values.ts"
import * as TokenGenerator from "../TokenGenerator.ts"
import {
  type CreateOrganizationParameters,
  DeleteOrganizationResponse
} from "./Api/OrganizationsApiClientDefinitionSchemas.ts"
import {
  CreateOrganizationMembershipParameters,
  type CreateUserParameters,
  DeleteOrganizationMembershipResponse,
  DeleteUserResponse
} from "./Api/UserManagementApiClientDefinitionSchemas.ts"
import {
  type RetrieveTokenByClientCredentialsParameters_Redacted,
  RetrieveTokenByClientCredentialsResponse
} from "./OAuth2/OAuth2ClientDefinitionSchemas.js"

class ClientsModel extends S.Class<ClientsModel>("ClientModel")({
  id: ClientId,
  orgId: OrganizationId,
  secret: S.NonEmptyTrimmedString
}) {}

class OrganizationsModel extends S.Class<OrganizationsModel>("OrganizationModel")({
  ...Organization.fields
}) {
  asEntity() {
    return Organization.make(this)
  }
}

class OrganizationMembershipsModel extends S.Class<OrganizationMembershipsModel>("OrganizationMembershipsModel")({
  ...OrganizationMembership.normalizedFields
}) {
  asEntity(organizationName: string) {
    return OrganizationMembership.make({
      ...this,
      organizationName
    })
  }
}

class UsersModel extends S.Class<UsersModel>("UserModel")({
  ...User.fields,

  password: pipe(
    S.NonEmptyTrimmedString,
    S.NullOr
  )
}) {
  asEntity() {
    return User.make(this)
  }
}

interface UserManagement {
  readonly createUser: (parameters: typeof CreateUserParameters.Type) => Effect.Effect<User>
  readonly deleteUser: (userId: UserId) => Effect.Effect<DeleteUserResponse>
  readonly retrieveUser: (userId: UserId) => Effect.Effect<User, ResourceNotFoundError>

  readonly createOrganizationMembership: (
    parameters: typeof CreateOrganizationMembershipParameters.Type
  ) => Effect.Effect<OrganizationMembership>
  readonly deleteOrganizationMembership: (
    organizationMembershipId: OrganizationMembershipId
  ) => Effect.Effect<DeleteOrganizationMembershipResponse>
}

interface Organizations {
  readonly createOrganization: (parameters: typeof CreateOrganizationParameters.Type) => Effect.Effect<Organization>
  readonly deleteOrganization: (organizationId: OrganizationId) => Effect.Effect<DeleteOrganizationResponse>
  readonly retrieveOrganization: (organizationId: OrganizationId) => Effect.Effect<Organization, ResourceNotFoundError>
}

export interface ApiClient {
  readonly userManagement: UserManagement
  readonly organizations: Organizations
}

export interface OAuth2Client {
  readonly retrieveTokenByClientCredentials: (
    parameters: RetrieveTokenByClientCredentialsParameters_Redacted
  ) => Effect.Effect<typeof RetrieveTokenByClientCredentialsResponse.Type, UnauthorizedError>
}

export type MakeOptions = {
  initialMachineClients?: ReadonlyArray<{
    clientId: ClientId
    orgId: OrganizationId
    secret: Redacted.Redacted<string>
  }>
}

export const make = (options?: MakeOptions): Effect.Effect<
  {
    readonly apiClient: ApiClient
    readonly oauth2Client: OAuth2Client
  },
  never,
  KeyValueStore.KeyValueStore | TokenGenerator.TokenGenerator
> =>
  Effect.gen(function*() {
    const { generator } = yield* TokenGenerator.TokenGenerator

    const usersStore = yield* Effect.map(
      KeyValueStore.KeyValueStore,
      (store) => store.forSchema(S.ReadonlyMap({ key: UserId, value: UsersModel }))
    )
    const loadAllUsers = pipe(
      usersStore.get("users"),
      Effect.map(Option.getOrElse<ReadonlyMap<UserId, UsersModel>>(() => new Map())),
      Effect.orDie
    )
    const findUserById = (userId: UserId) =>
      pipe(
        loadAllUsers,
        Effect.map((users) =>
          pipe(
            users.get(userId),
            Option.fromNullable
          )
        ),
        Effect.filterOrFail(
          Option.isSome,
          () => new ResourceNotFoundError()
        ),
        Effect.map(({ value }) => value)
      )
    const setUsers = (users: ReadonlyMap<UserId, UsersModel>) =>
      pipe(
        usersStore.set("users", users),
        Effect.orDie
      )
    const insertUser = (user: UsersModel) =>
      pipe(
        loadAllUsers,
        Effect.flatMap((existingUsers) => setUsers(new Map(existingUsers).set(user.id, user))),
        Effect.orDie
      )
    const deleteUser = (userId: UserId) =>
      pipe(
        loadAllUsers,
        Effect.flatMap((existingUsers) => {
          const users = new Map(existingUsers)
          const userExisted = users.delete(userId)

          return pipe(
            setUsers(users),
            Effect.map(() => ({ userExisted }))
          )
        }),
        Effect.orDie
      )

    const clientsStore = yield* Effect.map(
      KeyValueStore.KeyValueStore,
      (store) => store.forSchema(S.ReadonlyMap({ key: ClientId, value: ClientsModel }))
    )
    const setClients = (clients: ReadonlyMap<ClientId, ClientsModel>) =>
      pipe(
        clientsStore.set("clients", clients),
        Effect.orDie
      )
    const findClients = pipe(
      clientsStore.get("clients"),
      Effect.map(Option.getOrElse<ReadonlyMap<ClientId, ClientsModel>>(() => new Map())),
      Effect.orDie
    )
    const findClientById = (clientId: ClientId) =>
      pipe(
        findClients,
        Effect.map((clients) =>
          pipe(
            clients.get(clientId),
            Option.fromNullable
          )
        ),
        Effect.filterOrFail(
          Option.isSome,
          /*
           * The absence of a client ID is a special case
           */
          () => new UnauthorizedError()
        ),
        Effect.map(({ value }) => value)
      )

    const organizationsStore = yield* Effect.map(
      KeyValueStore.KeyValueStore,
      (store) => store.forSchema(S.ReadonlyMap({ key: OrganizationId, value: OrganizationsModel }))
    )
    const loadAllOrganizations = pipe(
      organizationsStore.get("organizations"),
      Effect.map(Option.getOrElse<ReadonlyMap<OrganizationId, OrganizationsModel>>(() => new Map())),
      Effect.orDie
    )
    const findOrganizationById = (organizationId: OrganizationId) =>
      pipe(
        loadAllOrganizations,
        Effect.map((organizations) =>
          pipe(
            organizations.get(organizationId),
            Option.fromNullable
          )
        ),
        Effect.filterOrFail(
          Option.isSome,
          () => new ResourceNotFoundError()
        ),
        Effect.map(({ value }) => value)
      )
    const setOrganizations = (organizations: ReadonlyMap<OrganizationId, OrganizationsModel>) =>
      pipe(
        organizationsStore.set("organizations", organizations),
        Effect.orDie
      )
    const insertOrganization = (organization: OrganizationsModel) =>
      pipe(
        loadAllOrganizations,
        Effect.flatMap((existingOrganizations) =>
          setOrganizations(new Map(existingOrganizations).set(organization.id, organization))
        ),
        Effect.orDie
      )
    const deleteOrganization = (organizationId: OrganizationId) =>
      pipe(
        loadAllOrganizations,
        Effect.flatMap((existingOrganizations) => {
          const organizations = new Map(existingOrganizations)
          const organizationExisted = organizations.delete(organizationId)

          return pipe(
            setOrganizations(organizations),
            Effect.map(() => ({ organizationExisted }))
          )
        }),
        Effect.orDie
      )

    const organizationMembershipsStore = yield* Effect.map(
      KeyValueStore.KeyValueStore,
      (store) => store.forSchema(S.HashMap({ key: OrganizationMembershipId, value: OrganizationMembershipsModel }))
    )
    const loadAllOrganizationMemberships = pipe(
      organizationMembershipsStore.get("organization_memberships"),
      Effect.map(Option.getOrElse(HashMap.empty<OrganizationMembershipId, OrganizationMembershipsModel>)),
      Effect.orDie
    )
    const findOrganizationMemberships = (filterOptions: {
      readonly organizationId?: OrganizationId
      readonly userId?: UserId
    }) =>
      pipe(
        loadAllOrganizationMemberships,
        Effect.map((organizationMemberships) =>
          pipe(
            organizationMemberships,
            HashMap.filter(({ organizationId, userId }) =>
              organizationId === filterOptions.organizationId && userId === filterOptions.userId
            ),
            HashMap.toValues
          )
        )
      )
    const setOrganizationMemberships = (
      organizationMemberships: HashMap.HashMap<OrganizationMembershipId, OrganizationMembershipsModel>
    ) =>
      pipe(
        organizationMembershipsStore.set("organization_memberships", organizationMemberships),
        Effect.orDie
      )
    const insertOrganizationMembership = (organizationMembership: OrganizationMembershipsModel) =>
      pipe(
        loadAllOrganizationMemberships,
        Effect.flatMap((organizationMemberships) =>
          pipe(
            organizationMemberships,
            HashMap.set(organizationMembership.id, organizationMembership),
            setOrganizationMemberships
          )
        )
      )
    const deleteOrganizationMembership = (organizationMembershipId: OrganizationMembershipId) =>
      pipe(
        loadAllOrganizationMemberships,
        Effect.flatMap((organizationMemberships) => {
          const organizationMembershipsExisted = HashMap.has(organizationMemberships, organizationMembershipId)
          const exit = Effect.succeed({ organizationMembershipsExisted })

          if (!organizationMembershipsExisted) {
            return exit
          }

          return Effect.zipRight(
            pipe(
              organizationMemberships,
              HashMap.remove(organizationMembershipId),
              setOrganizationMemberships
            ),
            exit
          )
        })
      )

    if (options?.initialMachineClients) {
      yield* setClients(
        new Map(
          options.initialMachineClients.map((client) => [
            client.clientId,
            ClientsModel.make({
              id: client.clientId,
              orgId: client.orgId,
              secret: Redacted.value(client.secret)
            })
          ])
        )
      )
    }

    return {
      apiClient: {
        userManagement: {
          createUser: Effect.fn(function*(parameters: typeof CreateUserParameters.Type) {
            const now = yield* DateTime.nowAsDate

            const user = UsersModel.make({
              id: generateUserId(),
              email: EmailAddress.make(parameters.email),
              emailVerified: false,
              password: parameters.password ?? null,
              firstName: parameters.firstName ?? null,
              lastName: parameters.lastName ?? null,
              externalId: parameters.externalId ?? null,
              profilePictureUrl: null,
              lastSignInAt: null,
              locale: null,
              metadata: parameters.metadata ?? {},
              createdAt: now,
              updatedAt: now
            })

            yield* insertUser(user)

            return user.asEntity()
          }),
          deleteUser: (userId: UserId) =>
            pipe(
              deleteUser(userId),
              Effect.map(({ userExisted }) => (
                userExisted
                  ? DeleteUserResponse.Success()
                  : DeleteUserResponse.NotFound()
              ))
            ),
          retrieveUser: (userId: UserId) =>
            pipe(
              findUserById(userId),
              Effect.map((user) => user.asEntity())
            ),

          createOrganizationMembership: Effect.fn(function*(parameters) {
            const [now, organization, user] = yield* pipe(
              Effect.all([
                DateTime.nowAsDate,
                findOrganizationById(parameters.organizationId),
                findUserById(parameters.userId)
              ]),
              Effect.orDie
            )

            const membership = yield* pipe(
              findOrganizationMemberships({
                organizationId: parameters.organizationId,
                userId: parameters.userId
              }),
              Effect.map(Arr.head),
              Effect.flatMap(
                Option.match({
                  onNone: () => {
                    const newMembership = OrganizationMembershipsModel.make({
                      id: generateOrganizationMembershipId(),
                      userId: user.id,
                      organizationId: organization.id,
                      roles: parameters.roles.map((slug) => Role.make({ slug })),
                      status: OrganizationMembershipStatus.make("active"),
                      createdAt: now,
                      updatedAt: now
                    })

                    return Effect.zipRight(
                      insertOrganizationMembership(newMembership),
                      Effect.succeed(newMembership)
                    )
                  },
                  /*
                   * This is a significant oversimplification of the true logic. I may revisit if we need to
                   * anticipate unusual states.
                   */
                  onSome: (existingMembership) => Effect.succeed(existingMembership)
                })
              )
            )

            return membership.asEntity(organization.name)
          }),
          deleteOrganizationMembership: (organizationMembershipId) =>
            pipe(
              deleteOrganizationMembership(organizationMembershipId),
              Effect.map(({ organizationMembershipsExisted }) => (
                organizationMembershipsExisted
                  ? DeleteOrganizationMembershipResponse.Success()
                  : DeleteOrganizationMembershipResponse.NotFound()
              ))
            )
        },
        organizations: {
          createOrganization: Effect.fn(function*(parameters) {
            const now = yield* DateTime.nowAsDate

            const organization = OrganizationsModel.make({
              id: generateOrganizationId(),
              name: parameters.name,
              domains: [],
              stripeCustomerId: null,
              externalId: parameters.externalId ?? null,
              metadata: parameters.metadata ?? {},
              createdAt: now,
              updatedAt: now
            })

            yield* insertOrganization(organization)

            return organization.asEntity()
          }),
          deleteOrganization: (organizationId) =>
            pipe(
              deleteOrganization(organizationId),
              Effect.map(({ organizationExisted }) => (
                organizationExisted
                  ? DeleteOrganizationResponse.Success()
                  : DeleteOrganizationResponse.NotFound()
              ))
            ),
          retrieveOrganization: (organizationId) =>
            pipe(
              findOrganizationById(organizationId),
              Effect.map((organization) => organization.asEntity())
            )
        }
      },
      oauth2Client: {
        retrieveTokenByClientCredentials: Effect.fn(function*(parameters) {
          const client = yield* findClientById(parameters.clientId)

          if (client.secret !== Redacted.value(parameters.clientSecret)) {
            return yield* Effect.fail(new UnauthorizedError())
          }

          const accessToken = yield* pipe(
            generator.generateMachineAccessToken({
              clientId: parameters.clientId,
              orgId: client.orgId
            }),
            Effect.orDie
          )

          return RetrieveTokenByClientCredentialsResponse.make({
            accessToken,
            expiresIn: Duration.hours(1),
            tokenType: "bearer"
          })
        })
      }
    }
  })
