import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import { Model } from "@effect/sql"
import { UserId } from "@one-kilo/domain/ids/UserId"
import { ModelAuditFields } from "../../utils/ModelFields.ts"

export class UsersModel extends Model.Class<UsersModel>("UsersModel")({
  id: Model.GeneratedByApp(UserId),

  workosUserId: WorkOSIds.UserId,

  ...ModelAuditFields
}) {}
