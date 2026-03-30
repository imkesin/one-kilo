import * as Model from "@effect/sql/Model"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { FullName, PreferredName } from "@one-kilo/domain/values/PersonValues"
import { ModelAuditFields } from "../../utils/ModelFields.ts"
import { EmailAddressesModel } from "../email-addresses/EmailAddressesModel.ts"

export class PersonsModel extends Model.Class<PersonsModel>("PersonsModel")({
  id: Model.GeneratedByApp(PersonId),

  preferredName: PreferredName,
  fullName: FullName,

  ...ModelAuditFields
}) {
  static asJsonBBuildObjectWithRelations({
    alias,
    emailAddressAlias
  } = {
    alias: "p",
    emailAddressAlias: "ea"
  }) {
    return `
      JSONB_BUILD_OBJECT(
        'id', ${alias}.id,
        'preferred_name', ${alias}.preferred_name,
        'full_name', ${alias}.full_name,
        'email_addresses',
          COALESCE(
            JSON_AGG(${EmailAddressesModel.asJsonBBuildObject({ alias: emailAddressAlias })})
            FILTER (WHERE ${emailAddressAlias}.id IS NOT NULL
          ),
          '[]'::jsonb
        ),
        'created_at', ${alias}.created_at,
        'updated_at', ${alias}.updated_at,
        'archived_at', ${alias}.archived_at
      )
    `
  }
}
