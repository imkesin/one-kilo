import * as Model from "@effect/sql/Model"
import { MachineClientId } from "@one-kilo/domain/ids/MachineClientId"
import { MachineClientName } from "@one-kilo/domain/values/MachineClientValues"
import { ModelAuditFields } from "../../utils/ModelFields.ts"

export class MachineClientsModel extends Model.Class<MachineClientsModel>(
  "MachineClientsModel"
)({
  id: Model.GeneratedByApp(MachineClientId),

  name: MachineClientName,

  ...ModelAuditFields
}) {
  static asJsonBBuildObject({ alias } = { alias: "mc" }) {
    return `
      JSONB_BUILD_OBJECT(
        'id', ${alias}.id,
        'name', ${alias}.name,
        'created_at', ${alias}.created_at,
        'updated_at', ${alias}.updated_at,
        'archived_at', ${alias}.archived_at
      )
    `
  }
}
