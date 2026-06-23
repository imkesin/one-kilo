import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import type { MachineClientUser, PersonUser, User } from "@one-kilo/domain/entities/User"
import { MachineClientIdFromPrefixed } from "@one-kilo/domain/ids/MachineClientId"
import { PersonIdFromPrefixed } from "@one-kilo/domain/ids/PersonId"
import { UserIdFromPrefixed } from "@one-kilo/domain/ids/UserId"
import { MachineClientName } from "@one-kilo/domain/values/MachineClientValues"
import { FullName, PreferredName } from "@one-kilo/domain/values/PersonValues"
import { UserType } from "@one-kilo/domain/values/UserValues"
import { pipe } from "effect/Function"
import * as Match from "effect/Match"
import * as S from "effect/Schema"
import { ApiAuditFields } from "../../internal/ApiFields.ts"
import { Api_EmailAddressOnPerson } from "../email-addresses/EmailAddressesApiSchemas.ts"

const Api_MachineClientOnUser = S.Struct({
  id: MachineClientIdFromPrefixed,
  name: MachineClientName,

  ...ApiAuditFields
})

class UsersApi_MachineClientUser extends S.TaggedClass<UsersApi_MachineClientUser>(
  "@one-kilo/server-api/User:MachineClient"
)(
  "User:MachineClient",
  {
    id: UserIdFromPrefixed,
    type: pipe(
      UserType,
      S.pickLiteral("MachineClient")
    ),
    machineClient: Api_MachineClientOnUser,

    ...ApiAuditFields
  }
) {
  static fromDomain = (user: MachineClientUser) => UsersApi_MachineClientUser.make(user)
}

const Api_PersonOnUser = S.Struct({
  id: PersonIdFromPrefixed,
  preferredName: PreferredName,
  fullName: FullName,
  emailAddresses: S.NonEmptyArray(Api_EmailAddressOnPerson),

  ...ApiAuditFields
})

class UsersApi_PersonUser extends S.TaggedClass<UsersApi_PersonUser>(
  "@one-kilo/server-api/User:Person"
)(
  "User:Person",
  {
    id: UserIdFromPrefixed,
    type: pipe(
      UserType,
      S.pickLiteral("Person")
    ),
    person: Api_PersonOnUser,

    ...ApiAuditFields
  }
) {
  static fromDomain = (user: PersonUser) => UsersApi_PersonUser.make(user)
}

const UsersApi_User = S.Union(
  UsersApi_PersonUser,
  UsersApi_MachineClientUser
)

class UsersApi_Me_Success extends S.TaggedClass<UsersApi_Me_Success>("@one-kilo/server-api/Me:Success")(
  "Me:Success",
  {
    user: UsersApi_User
  },
  HttpApiSchema.annotations({ status: 200 })
) {
  static fromDomain = (user: User) =>
    UsersApi_Me_Success.make({
      user: Match.valueTags(
        user,
        {
          "User:MachineClient": (user) => UsersApi_MachineClientUser.fromDomain(user),
          "User:Person": (user) => UsersApi_PersonUser.fromDomain(user)
        }
      )
    })
}

export const UsersApi_MeSchemas = {
  Success: UsersApi_Me_Success
} as const
