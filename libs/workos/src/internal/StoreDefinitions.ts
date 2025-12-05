import * as KeyValueStore from "@effect/platform/KeyValueStore"
import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as Redacted from "effect/Redacted"
import * as S from "effect/Schema"
import { User } from "../domain/DomainEntities.ts"
import { ResourceNotFoundError, UnauthorizedError } from "../domain/DomainErrors.ts"
import { ClientId, generateUserId, OrganizationId, UserId } from "../domain/DomainIds.ts"
import * as TokenGenerator from "../TokenGenerator.ts"
import type { CreateUserParameters } from "./Api/ApiClientDefinitionSchemas.ts"
import {
  type RetrieveTokenByClientCredentialsParameters_Redacted,
  RetrieveTokenByClientCredentialsResponse
} from "./OAuth2/OAuth2ClientDefinitionSchemas.js"

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

class ClientsModel extends S.Class<ClientsModel>("ClientModel")({
  id: ClientId,
  orgId: OrganizationId,
  secret: S.NonEmptyTrimmedString
}) {}

interface UserManagement {
  readonly createUser: (parameters: typeof CreateUserParameters.Type) => Effect.Effect<User, never>
  readonly retrieveUser: (userId: UserId) => Effect.Effect<User, ResourceNotFoundError>
}

export interface ApiClient {
  readonly userManagement: UserManagement
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
    const findUsers = pipe(
      usersStore.get("users"),
      Effect.map(Option.getOrElse<ReadonlyMap<UserId, UsersModel>>(() => new Map())),
      Effect.orDie
    )
    const findUserById = (userId: UserId) =>
      pipe(
        findUsers,
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
        findUsers,
        Effect.flatMap((existingUsers) => setUsers(new Map(existingUsers).set(user.id, user))),
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
          /**
           * The absence of a client ID is a special case
           */
          () => new UnauthorizedError()
        ),
        Effect.map(({ value }) => value)
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
              email: parameters.email,
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
          retrieveUser: (userId: UserId) =>
            pipe(
              findUserById(userId),
              Effect.map((user) => user.asEntity())
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
