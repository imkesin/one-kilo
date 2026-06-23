import { EmailAddressOnPerson } from "@one-kilo/domain/entities/EmailAddress"
import { Person, PersonEntity } from "@one-kilo/domain/entities/Person"
import * as S from "effect/Schema"
import { EmailAddressesModel } from "../../email-addresses/EmailAddressesModel.ts"
import { PersonsModel } from "../PersonsModel.ts"

export const toPersonEntity = ({
  id,
  preferredName,
  fullName,
  createdAt,
  updatedAt,
  archivedAt
}: typeof PersonsModel.select.Type) =>
  PersonEntity.make({
    id,
    preferredName,
    fullName,
    createdAt,
    updatedAt,
    archivedAt
  })

export const PersonRow = S.extend(
  PersonsModel.select,
  S.Struct({
    emailAddresses: S.Array(EmailAddressesModel.select)
  })
)

export const toPerson = (row: typeof PersonRow.Type): Person =>
  Person.make({
    id: row.id,
    preferredName: row.preferredName,
    fullName: row.fullName,
    emailAddresses: row.emailAddresses.map((emailAddress) =>
      EmailAddressOnPerson.make({
        id: emailAddress.id,
        value: emailAddress.value,
        createdAt: emailAddress.createdAt,
        updatedAt: emailAddress.updatedAt,
        archivedAt: emailAddress.archivedAt
      })
    ),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    archivedAt: row.archivedAt
  })
