import * as Model from "@effect/sql/Model"
import { AccountId } from "@one-kilo/domain/ids/AccountId"
import * as ModelExtensions from "./ModelExtensions.ts"

export const ModelAuditFields = {
  createdAt: Model.DateTimeInsert,
  createdByAccountId: Model.GeneratedByApp(AccountId),

  updatedAt: Model.DateTimeUpdate,
  updatedByAccountId: Model.GeneratedByApp(AccountId),

  archivedAt: ModelExtensions.DateTimeArchived
} as const
