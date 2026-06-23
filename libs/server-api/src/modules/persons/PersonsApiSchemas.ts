import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import type { Person } from "@one-kilo/domain/entities/Person"
import { PersonIdFromPrefixed } from "@one-kilo/domain/ids/PersonId"
import { FullName, PreferredName } from "@one-kilo/domain/values/PersonValues"
import * as S from "effect/Schema"
import { ApiAuditFields } from "../../internal/ApiFields.ts"
import { ForbiddenError } from "../../internal/ForbiddenError.ts"
import { Api_EmailAddressOnPerson } from "../email-addresses/EmailAddressesApiSchemas.ts"
import { PersonsApi_Update_PersonNotFoundError } from "./internal/PersonsApiErrors.ts"

const PersonsApi_Update_Path = S.Struct({
  personId: PersonIdFromPrefixed
})

const PersonsApi_Update_Payload = S.Struct({
  preferredName: S.optionalWith(PreferredName, { exact: true }),
  fullName: S.optionalWith(FullName, { exact: true })
})

const Api_Person = S.Struct({
  id: PersonIdFromPrefixed,
  preferredName: PreferredName,
  fullName: FullName,
  emailAddresses: S.Array(Api_EmailAddressOnPerson),

  ...ApiAuditFields
})

class PersonsApi_Update_Updated extends S.TaggedClass<PersonsApi_Update_Updated>(
  "@one-kilo/server-api/Persons.Update:Updated"
)(
  "Persons.Update:Updated",
  {
    person: Api_Person
  },
  HttpApiSchema.annotations({ status: 200 })
) {
  static fromDomain = (person: Person) => PersonsApi_Update_Updated.make({ person })
}

export const PersonsApi_UpdateSchemas = {
  Path: PersonsApi_Update_Path,
  Payload: PersonsApi_Update_Payload,
  Updated: PersonsApi_Update_Updated,
  Error: {
    PersonNotFound: PersonsApi_Update_PersonNotFoundError,
    Forbidden: ForbiddenError
  }
} as const
