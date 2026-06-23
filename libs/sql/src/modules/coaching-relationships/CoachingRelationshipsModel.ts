import * as Model from "@effect/sql/Model"
import { AthleteId } from "@one-kilo/domain/ids/AthleteId"
import { CoachId } from "@one-kilo/domain/ids/CoachId"
import { CoachingRelationshipId } from "@one-kilo/domain/ids/CoachingRelationshipId"
import { LocalDateRangeFromPgDateRange } from "../../utils/DateRangeFields.ts"
import { ModelAuditFields } from "../../utils/ModelFields.ts"

export class CoachingRelationshipsModel extends Model.Class<CoachingRelationshipsModel>("CoachingRelationshipsModel")({
  id: Model.GeneratedByApp(CoachingRelationshipId),

  coachId: CoachId,
  athleteId: AthleteId,

  period: LocalDateRangeFromPgDateRange,

  ...ModelAuditFields
}) {
  static asJsonBBuildObject({ alias = "cr" } = {}) {
    return `
      JSONB_BUILD_OBJECT(
        'id', ${alias}.id,
        'coach_id', ${alias}.coach_id,
        'athlete_id', ${alias}.athlete_id,
        'period', ${alias}.period,
        'created_at', ${alias}.created_at,
        'created_by_user_id', ${alias}.created_by_user_id,
        'updated_at', ${alias}.updated_at,
        'updated_by_user_id', ${alias}.updated_by_user_id,
        'archived_at', ${alias}.archived_at
      )
    `
  }
}
