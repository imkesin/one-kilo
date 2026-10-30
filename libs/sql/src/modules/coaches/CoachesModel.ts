import { CoachId } from "@one-kilo/domain/ids/CoachId"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { CoachVersion } from "@one-kilo/domain/versions/CoachVersion"
import * as Model from "effect/schema/Model"
import { ModelAuditFields } from "../../utils/ModelFields.ts"

export class CoachesModel extends Model.Class<CoachesModel>("CoachesModel")({
  id: Model.GeneratedByApp(CoachId),
  version: Model.GeneratedByDb(CoachVersion),

  personId: PersonId,

  ...ModelAuditFields
}) {
  static asJsonBBuildObject({ alias = "coaches" } = {}) {
    return `
      JSONB_BUILD_OBJECT(
        'id', ${alias}.id,
        'version', ${alias}.version,
        'person_id', ${alias}.person_id,
        'created_at', ${alias}.created_at,
        'created_by_account_id', ${alias}.created_by_account_id,
        'updated_at', ${alias}.updated_at,
        'updated_by_account_id', ${alias}.updated_by_account_id,
        'archived_at', ${alias}.archived_at
      )
    `
  }
}
