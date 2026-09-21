import * as HttpApiSchema from "@effect/platform/HttpApiSchema"
import type { Account } from "@one-kilo/domain/entities/Account"
import type { WorkspaceEntity } from "@one-kilo/domain/entities/Workspace"
import * as S from "effect/Schema"
import { Api_Account, toApi_Account } from "../accounts/AccountsApiSchemas.ts"
import { Api_Workspace } from "../workspaces/WorkspacesApiSchemas.ts"

type WhoAmIApi_Domain = {
  readonly account: Account
  readonly workspace: WorkspaceEntity
}

/**
 * The caller's identity as resolved from the Bearer token: the account and the workspace currently
 * in scope. Authorization (roles, permissions) is intentionally not part of this payload.
 */
class WhoAmIApi_Success extends S.TaggedClass<WhoAmIApi_Success>("@one-kilo/server-api/WhoAmI:Success")(
  "WhoAmI:Success",
  {
    account: Api_Account,
    workspace: Api_Workspace
  },
  HttpApiSchema.annotations({ status: 200 })
) {
  static fromDomain = ({ account, workspace }: WhoAmIApi_Domain) =>
    WhoAmIApi_Success.make({
      account: toApi_Account(account),
      workspace
    })
}

export const WhoAmIApiSchemas = {
  Success: WhoAmIApi_Success
} as const
