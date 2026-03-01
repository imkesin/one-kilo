import * as Model from "@effect/sql/Model"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { FullName, PreferredName } from "@one-kilo/domain/values/PersonValues"
import { ModelAuditFields } from "../../utils/ModelFields.ts"

export class PersonsModel extends Model.Class<PersonsModel>("PersonsModel")({
  id: Model.GeneratedByApp(PersonId),

  preferredName: PreferredName,
  fullName: FullName,

  ...ModelAuditFields
}) {}
