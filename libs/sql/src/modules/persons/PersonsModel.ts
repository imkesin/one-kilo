import * as Model from "@effect/sql/Model"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { FullName, PreferredName } from "@one-kilo/domain/values/PersonValues"
import { pipe } from "effect/Function"
import * as S from "effect/Schema"
import { ModelAuditFields } from "../../utils/ModelFields.ts"
import { EmailAddressesModel } from "../email-addresses/EmailAddressesModel.ts"

export class PersonsModel extends Model.Class<PersonsModel>("PersonsModel")({
  id: Model.GeneratedByApp(PersonId),

  preferredName: PreferredName,
  fullName: FullName,

  ...ModelAuditFields
}) {
  static asJsonBBuildObject({ alias = "p" } = {}) {
    return `
      JSONB_BUILD_OBJECT(
        'id', ${alias}.id,
        'preferred_name', ${alias}.preferred_name,
        'full_name', ${alias}.full_name,
        'created_at', ${alias}.created_at,
        'created_by_user_id', ${alias}.created_by_user_id,
        'updated_at', ${alias}.updated_at,
        'updated_by_user_id', ${alias}.updated_by_user_id,
        'archived_at', ${alias}.archived_at
      )
    `
  }

  static asJsonBBuildObjectWithRelations({
    alias = "p",
    emailAddressAlias = "ea"
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

    preferredName: pipe(
      PreferredName,
      S.optionalWith({ exact: true })
    ),
    fullName: pipe(
      FullName,
      S.optionalWith({ exact: true })
    ),

    updatedAt: PersonsModel.update.fields.updatedAt,
    updatedByUserId: PersonsModel.update.fields.updatedByUserId
  })
}
