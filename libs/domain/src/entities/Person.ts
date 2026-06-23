import * as Data from "effect/Data"
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
    lastName: S.NullOr(S.NonEmptyTrimmedString)
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
          fullName: lastName === null ? firstName : `${firstName} ${lastName}`
        }),
      encode: ({ fullName }, _, ast) => {
        const [firstName, ...rest] = fullName.split(/\s+/)
        const lastName = rest.join(" ")

        return firstName
          ? Effect.succeed({ firstName, lastName: lastName.length > 0 ? lastName : null })
          : Effect.fail(
            new ParseResult.Type(
              ast,
              fullName,
              "`fullName` must contain at least one non-whitespace part"
            )
          )
      }
    }
  )
)
const encodeWorkOSName = S.encode(PersonNameFromWorkOSName)

type PersonFieldsPatch = {
  readonly preferredName?: PreferredName
  readonly fullName?: FullName
}

type PersonDiff = Data.TaggedEnum<{
  Changed: { readonly fields: PersonFieldsPatch }
  Unchanged: {}
}>
const PersonDiff = Data.taggedEnum<PersonDiff>()

const diffPersonFields = (
  person: {
    readonly preferredName: PreferredName
    readonly fullName: FullName
  },
  fields: PersonFieldsPatch
) => {
  const changed: { -readonly [K in keyof PersonFieldsPatch]: PersonFieldsPatch[K] } = {}

  if (fields.preferredName && fields.preferredName !== person.preferredName) {
    changed.preferredName = fields.preferredName
  }

  if (fields.fullName && fields.fullName !== person.fullName) {
    changed.fullName = fields.fullName
  }

  return Object.keys(changed).length === 0
    ? PersonDiff.Unchanged()
    : PersonDiff.Changed({ fields: changed })
}

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

  diff = (fields: PersonFieldsPatch) => diffPersonFields(this, fields)
}

export class Person extends S.TaggedClass<Person>("@one-kilo/domain/Person")(
  "Person",
  {
    ...EntityBaseFields,

    emailAddresses: S.Array(EmailAddressOnPerson)
  },
  {
    identifier: "Person",
    title: "Person",
    description: "A person"
  }
) {}

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
