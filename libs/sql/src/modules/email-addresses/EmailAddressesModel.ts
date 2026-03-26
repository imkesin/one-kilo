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
}) {}
