import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { FullName, PreferredName, Sex, Timezone } from "@one-kilo/domain/values/PersonValues"
import { PersonVersion } from "@one-kilo/domain/versions/PersonVersion"
import * as S from "effect/Schema"
import * as Model from "effect/schema/Model"
import { LocalDateFromPgDate } from "../../utils/DateFields.ts"
import { ModelAuditFields } from "../../utils/ModelFields.ts"
import { EmailAddressesModel } from "../email-addresses/EmailAddressesModel.ts"

export class PersonsModel extends Model.Class<PersonsModel>("PersonsModel")({
  id: Model.GeneratedByApp(PersonId),
  version: Model.GeneratedByDb(PersonVersion),

  preferredName: PreferredName,
  fullName: FullName,

  sex: S.NullOr(Sex),
  dateOfBirth: S.NullOr(LocalDateFromPgDate),

  timezone: Model.Field({
    select: Timezone,
    insert: S.optionalKey(Timezone),
    update: S.optionalKey(Timezone),
    json: Timezone
  }),

  ...ModelAuditFields
}) {
  static asJsonBBuildObject({ alias = "persons" } = {}) {
    return `
      JSONB_BUILD_OBJECT(
        'id', ${alias}.id,
        'version', ${alias}.version,
        'preferred_name', ${alias}.preferred_name,
        'full_name', ${alias}.full_name,
        'sex', ${alias}.sex,
        'date_of_birth', ${alias}.date_of_birth,
        'timezone', ${alias}.timezone,
        'created_at', ${alias}.created_at,
        'created_by_account_id', ${alias}.created_by_account_id,
        'updated_at', ${alias}.updated_at,
        'updated_by_account_id', ${alias}.updated_by_account_id,
        'archived_at', ${alias}.archived_at
      )
    `
  }

  static asJsonBBuildObjectWithRelations({
    alias = "persons",
    emailAddressAlias = "email_addresses"
  } = {}) {
    return `
      ${PersonsModel.asJsonBBuildObject({ alias })}
      || JSONB_BUILD_OBJECT(
        'email_addresses', ${EmailAddressesModel.asJsonBAggForPerson({ alias: emailAddressAlias, personAlias: alias })}
      )
    `
  }

  static partialUpdate = S.Struct({
    id: PersonId,
    version: PersonVersion,

    preferredName: S.optionalKey(PreferredName),
    fullName: S.optionalKey(FullName),

    sex: S.optionalKey(Sex),
    dateOfBirth: S.optionalKey(LocalDateFromPgDate),
    timezone: S.optionalKey(Timezone),

    updatedAt: PersonsModel.update.fields.updatedAt,
    updatedByAccountId: PersonsModel.update.fields.updatedByAccountId
  })
}
