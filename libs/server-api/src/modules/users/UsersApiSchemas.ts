import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import type { MachineClientUser, PersonUser, User } from "@one-kilo/domain/entities/User"
import { EmailAddressIdFromPrefixed } from "@one-kilo/domain/ids/EmailAddressId"
import { MachineClientIdFromPrefixed } from "@one-kilo/domain/ids/MachineClientId"
import { PersonIdFromPrefixed } from "@one-kilo/domain/ids/PersonId"
import { UserIdFromPrefixed } from "@one-kilo/domain/ids/UserId"
import { EmailAddress } from "@one-kilo/domain/values/EmailAddressValues"
import { MachineClientName } from "@one-kilo/domain/values/MachineClientValues"
import { FullName, PreferredName } from "@one-kilo/domain/values/PersonValues"
import { UserType } from "@one-kilo/domain/values/UserValues"
import { pipe } from "effect/Function"
import * as Match from "effect/Match"
import * as S from "effect/Schema"
import { ApiAuditFields } from "../../internal/ApiFields.ts"

const Api_MachineClientOnUser = S.Struct({
  id: MachineClientIdFromPrefixed,
  name: MachineClientName,

  ...ApiAuditFields
})

class UsersApi_MachineClientUser extends S.TaggedClass<UsersApi_MachineClientUser>(
  "@one-kilo/server-api/MachineClientUser"
)(
  "MachineClientUser",
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
  static fromDomain(user: MachineClientUser) {
    return new UsersApi_MachineClientUser(user)
  }
}

const Api_EmailAddressOnPerson = S.Struct({
  id: EmailAddressIdFromPrefixed,
  value: EmailAddress,

  ...ApiAuditFields
})

const Api_PersonOnUser = S.Struct({
  id: PersonIdFromPrefixed,
  preferredName: PreferredName,
  fullName: FullName,
  emailAddresses: S.NonEmptyArray(Api_EmailAddressOnPerson),

  ...ApiAuditFields
})

class UsersApi_PersonUser extends S.TaggedClass<UsersApi_PersonUser>(
  "@one-kilo/server-api/PersonUser"
)(
  "PersonUser",
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
  static fromDomain(user: PersonUser) {
    return new UsersApi_PersonUser(user)
  }
}

const UsersApi_User = S.Union(
  UsersApi_PersonUser,
  UsersApi_MachineClientUser
)

const matchDomainToApi = pipe(
  Match.type<User>(),
  Match.tagsExhaustive({
    "User:MachineClient": (user) => UsersApi_MachineClientUser.fromDomain(user),
    "User:Person": (user) => UsersApi_PersonUser.fromDomain(user)
  })
)

class UsersApi_Me_Success extends S.TaggedClass<UsersApi_Me_Success>("@one-kilo/server-api/Me:Success")(
  "Me:Success",
  {
    user: UsersApi_User
  },
  HttpApiSchema.annotations({ status: 200 })
) {
  static fromDomain(user: User) {
    return new UsersApi_Me_Success({ user: matchDomainToApi(user) })
  }
}

export const UsersApi_MeSchemas = {
  Success: UsersApi_Me_Success
} as const
