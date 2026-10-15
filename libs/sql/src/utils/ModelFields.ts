import { AccountId } from "@one-kilo/domain/ids/AccountId"
import * as Model from "effect/schema/Model"
import * as ModelExtensions from "./ModelExtensions.ts"

export const ModelAuditFields = {
  createdAt: Model.DateTimeInsert,
  createdByAccountId: Model.GeneratedByApp(AccountId),

  updatedAt: Model.DateTimeUpdate,
  updatedByAccountId: Model.GeneratedByApp(AccountId),

  archivedAt: ModelExtensions.DateTimeArchived
} as const
