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
}) {}
