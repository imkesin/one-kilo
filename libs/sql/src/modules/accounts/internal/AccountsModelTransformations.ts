import {
  type Account,
  type AccountEntity,
  MachineClientAccount,
  MachineClientAccountEntity,
  PersonAccount,
  PersonAccountEntity
} from "@one-kilo/domain/entities/Account"
import { EmailAddressOnPerson } from "@one-kilo/domain/entities/EmailAddress"
import { MachineClientOnAccount } from "@one-kilo/domain/entities/MachineClient"
import { PersonOnAccount } from "@one-kilo/domain/entities/Person"
import { dieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Arr from "effect/Array"
import * as Effect from "effect/Effect"
import type { EmailAddressesModel } from "../../email-addresses/EmailAddressesModel.ts"
import type { MachineClientsModel } from "../../machine-clients/MachineClientsModel.ts"
import type { PersonsModel } from "../../persons/PersonsModel.ts"
import type { AccountsModel } from "../AccountsModel.ts"

export const toPersonAccountEntity = ({
  id,
  type,
  personId,
  workosUserId,
  createdAt,
  updatedAt,
  archivedAt
}: typeof AccountsModel.select.Type): Effect.Effect<PersonAccountEntity> => {
  if (
    type === "Person"
    && personId
    && workosUserId
  ) {
    return Effect.succeed(
      PersonAccountEntity.make({
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

  return dieWithUnexpectedError("An account model could not be transformed into a person account entity.")
}

export const toAccountEntity = ({
  id,
  type,
  personId,
  workosUserId,
  machineClientId,
  workosClientId,
  createdAt,
  updatedAt,
  archivedAt
}: typeof AccountsModel.select.Type): Effect.Effect<AccountEntity> => {
  if (
    type === "Person"
    && personId
    && workosUserId
  ) {
    return Effect.succeed(
      PersonAccountEntity.make({
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
      MachineClientAccountEntity.make({
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

  return dieWithUnexpectedError(
    "An account model could not be converted to a domain entity",
    {
      account: {
        id,
        type
      }
    }
  )
}

type PersonWithEmailAddresses = typeof PersonsModel.select.Type & {
  emailAddresses: ReadonlyArray<typeof EmailAddressesModel.select.Type>
}
type AccountWithRelations = typeof AccountsModel.select.Type & {
  person: PersonWithEmailAddresses | null
  machineClient: typeof MachineClientsModel.select.Type | null
}

export const toAccount = ({
  id,
  type,
  workosUserId,
  workosClientId,
  person,
  machineClient,
  createdAt,
  updatedAt,
  archivedAt
}: AccountWithRelations): Effect.Effect<Account> => {
  if (
    type === "Person"
    && workosUserId
    && person
    && Arr.isNonEmptyReadonlyArray(person.emailAddresses)
  ) {
    const [onlyEmailAddress] = person.emailAddresses

    return Effect.succeed(
      PersonAccount.make({
        id,
        type: "Person",
        workosUserId,
        person: PersonOnAccount.make({
          id: person.id,
          preferredName: person.preferredName,
          fullName: person.fullName,
          sex: person.sex,
          dateOfBirth: person.dateOfBirth,
          timezone: person.timezone,
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
      MachineClientAccount.make({
        id,
        type: "MachineClient",
        workosClientId,
        machineClient: MachineClientOnAccount.make({
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

  return dieWithUnexpectedError(
    "An account model with relations could not be converted to a domain account",
    {
      account: {
        id,
        type
      }
    }
  )
}
