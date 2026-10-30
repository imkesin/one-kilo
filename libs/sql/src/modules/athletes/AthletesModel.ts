import { AthleteId } from "@one-kilo/domain/ids/AthleteId"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { AthleteVersion } from "@one-kilo/domain/versions/AthleteVersion"
import * as Model from "effect/schema/Model"
import { ModelAuditFields } from "../../utils/ModelFields.ts"

export class AthletesModel extends Model.Class<AthletesModel>("@one-kilo/sql/AthletesModel")({
  id: Model.GeneratedByApp(AthleteId),
  version: Model.GeneratedByDb(AthleteVersion),

  personId: PersonId,

  ...ModelAuditFields
}) {}
