import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as ParseResult from "effect/ParseResult"
import * as S from "effect/Schema"
import { PersonId } from "../ids/PersonId.ts"
import { FullName, PreferredName } from "../values/PersonValues.ts"
import { EmailAddressOnPerson } from "./EmailAddress.ts"
import { EntityAuditFields } from "./internal/EntityFields.ts"

const EntityBaseFields = {
  id: PersonId,

  preferredName: PreferredName,
  fullName: FullName,

  ...EntityAuditFields
} as const

const PersonNameFromWorkOSName = pipe(
  S.Struct({
    firstName: S.NonEmptyTrimmedString,
    lastName: S.NonEmptyTrimmedString
  }),
  S.transformOrFail(
    S.Struct({
      preferredName: PreferredName,
      fullName: FullName
    }),
    {
      decode: ({ firstName, lastName }) =>
        Effect.succeed({
          preferredName: firstName,
          fullName: `${firstName} ${lastName}`
        }),
      encode: ({ fullName }, _, ast) => {
        const [firstName, ...rest] = fullName.split(/\s+/)
        const lastName = rest.join(" ")

        return firstName && lastName.length > 0
          ? Effect.succeed({ firstName, lastName })
          : Effect.fail(
            new ParseResult.Type(
              ast,
              fullName,
              "`fullName` must contain at least two whitespace-separated parts"
            )
          )
      }
    }
  )
)
const encodeWorkOSName = S.encode(PersonNameFromWorkOSName)

export class PersonEntity extends S.TaggedClass<PersonEntity>("@one-kilo/domain/PersonEntity")(
  "PersonEntity",
  {
    ...EntityBaseFields
  },
  {
    identifier: "PersonEntity",
    title: "Person Entity",
    description: "A minimal person entity"
  }
) {
  deriveWorkOSName = () =>
    encodeWorkOSName({
      preferredName: this.preferredName,
      fullName: this.fullName
    })
}

export class PersonOnUser extends S.TaggedClass<PersonOnUser>("@one-kilo/domain/PersonOnUser")(
  "PersonOnUser",
  {
    ...EntityBaseFields,

    emailAddresses: S.NonEmptyArray(EmailAddressOnPerson)
  },
  {
    identifier: "PersonOnUser",
    title: "Person (on User)",
    description: "A person linked to a user"
  }
) {
  deriveWorkOSName = () =>
    encodeWorkOSName({
      preferredName: this.preferredName,
      fullName: this.fullName
    })
}
