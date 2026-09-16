import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as Model from "@effect/sql/Model"
import { AccountId } from "@one-kilo/domain/ids/AccountId"
import { MachineClientId } from "@one-kilo/domain/ids/MachineClientId"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { AccountType } from "@one-kilo/domain/values/AccountValues"
import * as S from "effect/Schema"
import { ModelAuditFields } from "../../utils/ModelFields.ts"

export class AccountsModel extends Model.Class<AccountsModel>("AccountsModel")({
  id: Model.GeneratedByApp(AccountId),

  type: AccountType,

  personId: S.NullOr(PersonId),
  workosUserId: S.NullOr(WorkOSIds.UserId),

  machineClientId: S.NullOr(MachineClientId),
  workosClientId: S.NullOr(WorkOSIds.ApplicationClientId),

  ...ModelAuditFields
}) {
  static asJsonBBuildObject({ alias = "u" } = {}) {
    return `
      JSONB_BUILD_OBJECT(
        'id', ${alias}.id,
        'type', ${alias}.type,
        'person_id', ${alias}.person_id,
        'workos_user_id', ${alias}.workos_user_id,
        'machine_client_id', ${alias}.machine_client_id,
        'workos_client_id', ${alias}.workos_client_id,
        'created_at', ${alias}.created_at,
        'created_by_account_id', ${alias}.created_by_account_id,
        'updated_at', ${alias}.updated_at,
        'updated_by_account_id', ${alias}.updated_by_account_id,
        'archived_at', ${alias}.archived_at
      )
    `
  }
}
