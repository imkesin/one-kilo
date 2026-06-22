import * as Model from "@effect/sql/Model"
import { AthleteId } from "@one-kilo/domain/ids/AthleteId"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { ModelAuditFields } from "../../utils/ModelFields.ts"

export class AthletesModel extends Model.Class<AthletesModel>("@one-kilo/sql/AthletesModel")({
  id: Model.GeneratedByApp(AthleteId),

  personId: PersonId,

  ...ModelAuditFields
}) {}
