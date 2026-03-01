import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as Model from "@effect/sql/Model"
import { MachineId } from "@one-kilo/domain/ids/MachineId"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { UserId } from "@one-kilo/domain/ids/UserId"
import { UserType } from "@one-kilo/domain/values/UserValues"
import * as S from "effect/Schema"
import { ModelAuditFields } from "../../utils/ModelFields.ts"

export class UsersModel extends Model.Class<UsersModel>("UsersModel")({
  id: Model.GeneratedByApp(UserId),

  type: UserType,

  personId: S.NullOr(PersonId),
  workosUserId: S.NullOr(WorkOSIds.UserId),

  machineId: S.NullOr(MachineId),
  workosClientId: S.NullOr(WorkOSIds.ApplicationClientId),

  ...ModelAuditFields
}) {}
