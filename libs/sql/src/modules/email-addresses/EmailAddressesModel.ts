import * as Model from "@effect/sql/Model"
import { EmailAddressId } from "@one-kilo/domain/ids/EmailAddressId"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { EmailAddress } from "@one-kilo/domain/values/EmailAddressValues"
import { ModelAuditFields } from "../../utils/ModelFields.ts"

export class EmailAddressesModel extends Model.Class<EmailAddressesModel>("EmailAddressesModel")({
  id: Model.GeneratedByApp(EmailAddressId),

  personId: PersonId,
  value: EmailAddress,

  ...ModelAuditFields
}) {
  static asJsonBBuildObject({ alias } = { alias: "ea" }) {
    return `
      JSONB_BUILD_OBJECT(
        'id', ${alias}.id,
        'person_id', ${alias}.person_id,
        'value', ${alias}.value,
        'created_at', ${alias}.created_at,
        'updated_at', ${alias}.updated_at,
        'archived_at', ${alias}.archived_at
      )
    `
  }
}
