import * as Model from "@effect/sql/Model"
import { CoachId } from "@one-kilo/domain/ids/CoachId"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { ModelAuditFields } from "../../utils/ModelFields.ts"

export class CoachesModel extends Model.Class<CoachesModel>("CoachesModel")({
  id: Model.GeneratedByApp(CoachId),

  personId: PersonId,

  ...ModelAuditFields
}) {
  static asJsonBBuildObject({ alias = "coa" } = {}) {
    return `
      JSONB_BUILD_OBJECT(
        'id', ${alias}.id,
        'person_id', ${alias}.person_id,
        'created_at', ${alias}.created_at,
        'created_by_user_id', ${alias}.created_by_user_id,
        'updated_at', ${alias}.updated_at,
        'updated_by_user_id', ${alias}.updated_by_user_id,
        'archived_at', ${alias}.archived_at
      )
    `
  }
}
