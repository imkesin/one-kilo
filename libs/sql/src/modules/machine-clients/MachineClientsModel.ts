import { MachineClientId } from "@one-kilo/domain/ids/MachineClientId"
import { MachineClientName } from "@one-kilo/domain/values/MachineClientValues"
import { MachineClientVersion } from "@one-kilo/domain/versions/MachineClientVersion"
import * as Model from "effect/schema/Model"
import { ModelAuditFields } from "../../utils/ModelFields.ts"

export class MachineClientsModel extends Model.Class<MachineClientsModel>(
  "MachineClientsModel"
)({
  id: Model.GeneratedByApp(MachineClientId),
  version: Model.GeneratedByDb(MachineClientVersion),

  name: MachineClientName,

  ...ModelAuditFields
}) {
  static asJsonBBuildObject({ alias = "machine_clients" } = {}) {
    return `
      JSONB_BUILD_OBJECT(
        'id', ${alias}.id,
        'version', ${alias}.version,
        'name', ${alias}.name,
        'created_at', ${alias}.created_at,
        'updated_at', ${alias}.updated_at,
        'archived_at', ${alias}.archived_at
      )
    `
  }
}
