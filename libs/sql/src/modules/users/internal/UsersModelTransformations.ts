import { EmailAddressOnPerson } from "@one-kilo/domain/entities/EmailAddress"
import { MachineClientOnUser } from "@one-kilo/domain/entities/MachineClient"
import { PersonOnUser } from "@one-kilo/domain/entities/Person"
import {
  MachineClientUser,
  MachineClientUserEntity,
  PersonUser,
  PersonUserEntity,
  type User,
  type UserEntity
} from "@one-kilo/domain/entities/User"
import { dieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Arr from "effect/Array"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import type { EmailAddressesModel } from "../../email-addresses/EmailAddressesModel.ts"
import type { MachineClientsModel } from "../../machine-clients/MachineClientsModel.ts"
import type { PersonsModel } from "../../persons/PersonsModel.ts"
import type { UsersModel } from "../UsersModel.ts"

export const toUserEntity = ({
  id,
  type,
  personId,
  workosUserId,
  machineClientId,
  workosClientId,
  createdAt,
  updatedAt,
  archivedAt
}: typeof UsersModel.select.Type): Effect.Effect<UserEntity> => {
  if (
    type === "Person"
    && personId
    && workosUserId
  ) {
    return Effect.succeed(
      PersonUserEntity.make({
        id,
        type: "Person",
        personId,
        workosUserId,
        createdAt,
        updatedAt,
        archivedAt
      })
    )
  }

  if (
    type === "MachineClient"
    && machineClientId
    && workosClientId
  ) {
    return Effect.succeed(
      MachineClientUserEntity.make({
        id,
        type: "MachineClient",
        machineClientId,
        workosClientId,
        createdAt,
        updatedAt,
        archivedAt
      })
    )
  }

  return pipe(
    dieWithUnexpectedError("A user model could not be converted to a domain entity"),
    Effect.annotateLogs({
      user: {
        id,
        type
      }
    })
  )
}

type PersonWithEmailAddresses = typeof PersonsModel.select.Type & {
  emailAddresses: ReadonlyArray<typeof EmailAddressesModel.select.Type>
}
type UserWithRelations = typeof UsersModel.select.Type & {
  person: PersonWithEmailAddresses | null
  machineClient: typeof MachineClientsModel.select.Type | null
}

export const toUser = ({
  id,
  type,
  workosUserId,
  workosClientId,
  person,
  machineClient,
  createdAt,
  updatedAt,
  archivedAt
}: UserWithRelations): Effect.Effect<User> => {
  if (
    type === "Person"
    && workosUserId
    && person
    && Arr.isNonEmptyReadonlyArray(person.emailAddresses)
  ) {
    const [onlyEmailAddress] = person.emailAddresses

    return Effect.succeed(
      PersonUser.make({
        id,
        type: "Person",
        workosUserId,
        person: PersonOnUser.make({
          id: person.id,
          preferredName: person.preferredName,
          fullName: person.fullName,
          emailAddresses: [
            EmailAddressOnPerson.make({
              id: onlyEmailAddress.id,
              value: onlyEmailAddress.value,
              createdAt: onlyEmailAddress.createdAt,
              updatedAt: onlyEmailAddress.updatedAt,
              archivedAt: onlyEmailAddress.archivedAt
            })
          ],
          createdAt: person.createdAt,
          updatedAt: person.updatedAt,
          archivedAt: person.archivedAt
        }),
        createdAt,
        updatedAt,
        archivedAt
      })
    )
  }

  if (
    type === "MachineClient"
    && workosClientId
    && machineClient
  ) {
    return Effect.succeed(
      MachineClientUser.make({
        id,
        type: "MachineClient",
        workosClientId,
        machineClient: MachineClientOnUser.make({
          id: machineClient.id,
          name: machineClient.name,
          createdAt: machineClient.createdAt,
          updatedAt: machineClient.updatedAt,
          archivedAt: machineClient.archivedAt
        }),
        createdAt,
        updatedAt,
        archivedAt
      })
    )
  }

  return pipe(
    dieWithUnexpectedError("A user model with relations could not be converted to a domain user"),
    Effect.annotateLogs({
      user: {
        id,
        type
      }
    })
  )
}
