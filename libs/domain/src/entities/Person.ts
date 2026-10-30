import * as Arr from "effect/Array"
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import * as SchemaIssue from "effect/SchemaIssue"
import * as SchemaTransformation from "effect/SchemaTransformation"
import { PersonId } from "../ids/PersonId.ts"
import { LocalDate } from "../values/LocalDate.ts"
import { FullName, PreferredName, Sex, Timezone } from "../values/PersonValues.ts"
import { PersonVersion } from "../versions/PersonVersion.ts"
import { EmailAddressOnPerson } from "./EmailAddress.ts"
import { EntityAuditFields } from "./internal/EntityFields.ts"

const EntityBaseFields = {
  id: PersonId,
  version: PersonVersion,

  preferredName: PreferredName,
  fullName: FullName,

  sex: S.NullOr(Sex),
  dateOfBirth: S.NullOr(LocalDate),
  timezone: Timezone,

  ...EntityAuditFields
} as const

const PersonNameFromWorkOSName = pipe(
  S.Struct({
    firstName: S.Trimmed.check(S.isNonEmpty()),
    lastName: S.NullOr(S.Trimmed.check(S.isNonEmpty()))
  }),
  S.decodeTo(
    S.Struct({
      preferredName: PreferredName,
      fullName: FullName
    }),
    SchemaTransformation.transformEffect({
      decode: ({ firstName, lastName }) =>
        Effect.succeed({
          preferredName: firstName,
          fullName: lastName === null ? firstName : `${firstName} ${lastName}`
        }),
      encode: ({ fullName }) => {
        const [firstName, ...rest] = fullName.split(/\s+/)
        const lastName = rest.join(" ")

        return firstName
          ? Effect.succeed({ firstName, lastName: lastName.length > 0 ? lastName : null })
          : Effect.fail(
            new SchemaIssue.InvalidValue(
              { message: "`fullName` must contain at least one non-whitespace part" },
              fullName
            )
          )
      }
    })
  )
)
const encodeWorkOSName = S.encodeEffect(PersonNameFromWorkOSName)

type PersonFieldsPatch = {
  readonly preferredName?: PreferredName
  readonly fullName?: FullName
  readonly sex?: Sex
  readonly dateOfBirth?: LocalDate
  readonly timezone?: Timezone
}
export type PersonMutableFieldKey = keyof PersonFieldsPatch

type PersonDiff = Data.TaggedEnum<{
  Changed: {
    readonly patch: PersonFieldsPatch
    readonly keys: Arr.NonEmptyReadonlyArray<keyof PersonFieldsPatch>
  }
  Unchanged: {}
}>
const PersonDiff = Data.taggedEnum<PersonDiff>()

const diffPersonFields = (
  person: {
    readonly preferredName: PreferredName
    readonly fullName: FullName
    readonly sex: Sex | null
    readonly dateOfBirth: LocalDate | null
    readonly timezone: Timezone
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

  if (fields.sex && fields.sex !== person.sex) {
    changed.sex = fields.sex
  }

  if (
    fields.dateOfBirth
    && (person.dateOfBirth === null || !fields.dateOfBirth.equals(person.dateOfBirth))
  ) {
    changed.dateOfBirth = fields.dateOfBirth
  }

  if (fields.timezone && fields.timezone !== person.timezone) {
    changed.timezone = fields.timezone
  }

  const changedKeys = Object.keys(changed) as ReadonlyArray<keyof PersonFieldsPatch>

  return Arr.isReadonlyArrayNonEmpty(changedKeys)
    ? PersonDiff.Changed({ keys: changedKeys, patch: changed })
    : PersonDiff.Unchanged()
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

export class PersonOnAccount extends S.TaggedClass<PersonOnAccount>("@one-kilo/domain/PersonOnAccount")(
  "PersonOnAccount",
  {
    ...EntityBaseFields,

    emailAddresses: S.NonEmptyArray(EmailAddressOnPerson)
  },
  {
    identifier: "PersonOnAccount",
    title: "Person (on Account)",
    description: "A person linked to an account"
  }
) {
  deriveWorkOSName = () =>
    encodeWorkOSName({
      preferredName: this.preferredName,
      fullName: this.fullName
    })
}
