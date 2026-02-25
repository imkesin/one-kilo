import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as Model from "@effect/sql/Model"
import { UserId } from "@one-kilo/domain/ids/UserId"
import { UserType } from "@one-kilo/domain/values/UserValues"
import * as S from "effect/Schema"
import { ModelAuditFields } from "../../utils/ModelFields.ts"

export class UsersModel extends Model.Class<UsersModel>("UsersModel")({
  id: Model.GeneratedByApp(UserId),

  type: UserType,

  workosUserId: S.NullOr(WorkOSIds.UserId),
  workosClientId: S.NullOr(WorkOSIds.ApplicationClientId),

  ...ModelAuditFields
}) {}
