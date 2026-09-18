import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import { AuthenticationIdentity } from "@one-kilo/domain/values/AuthenticationContext"
import { orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import * as S from "effect/Schema"

type FindAuthenticationIdentityParameters = {
  readonly workosUserId: WorkOSIds.UserId
  readonly workosOrganizationId: WorkOSIds.OrganizationId
}
type FindDefaultAuthenticationIdentityParameters = {
  readonly workosUserId: WorkOSIds.UserId
}

export class AuthenticationQueryRepository extends Effect.Service<AuthenticationQueryRepository>()(
  "@one-kilo/sql/AuthenticationQueryRepository",
  {
    dependencies: [],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient

      const findAuthenticationIdentitySchema = SqlSchema.findOne({
        Request: S.Struct({
          workosUserId: WorkOSIds.UserId,
          workosOrganizationId: WorkOSIds.OrganizationId
        }),
        Result: AuthenticationIdentity,
        execute: ({ workosUserId, workosOrganizationId }) =>
          sql`
            SELECT
              accounts.id AS account_id,
              workspaces.id AS workspace_id
            FROM accounts
            JOIN workspace_memberships ON workspace_memberships.account_id = accounts.id
            JOIN workspaces ON workspaces.id = workspace_memberships.workspace_id
            WHERE
              accounts.workos_user_id = ${workosUserId}
              AND workspaces.workos_organization_id = ${workosOrganizationId}
              AND accounts.archived_at IS NULL
              AND workspace_memberships.archived_at IS NULL
              AND workspaces.archived_at IS NULL
            LIMIT 1
          `
      })
      const findAuthenticationIdentity = Effect.fn("AuthenticationQueryRepository.findAuthenticationIdentity")(
        function*(parameters: FindAuthenticationIdentityParameters) {
          return yield* findAuthenticationIdentitySchema(parameters)
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding authentication identity")
      )

      const findDefaultAuthenticationIdentitySchema = SqlSchema.findOne({
        Request: S.Struct({
          workosUserId: WorkOSIds.UserId
        }),
        Result: S.extend(
          AuthenticationIdentity,
          S.Struct({ workosOrganizationId: WorkOSIds.OrganizationId })
        ),
        execute: ({ workosUserId }) =>
          sql`
            SELECT
              accounts.id AS account_id,
              workspaces.id AS workspace_id,
              workspaces.workos_organization_id as workos_organization_id
            FROM accounts
            JOIN workspace_memberships ON workspace_memberships.account_id = accounts.id
            JOIN workspaces ON workspaces.id = workspace_memberships.workspace_id
            WHERE
              accounts.workos_user_id = ${workosUserId}
              AND workspaces.type = 'Personal'
              AND workspace_memberships.role = 'Owner'
              AND accounts.archived_at IS NULL
              AND workspace_memberships.archived_at IS NULL
              AND workspaces.archived_at IS NULL
            LIMIT 1
          `
      })
      const findDefaultAuthenticationIdentity = Effect.fn(
        "AuthenticationQueryRepository.findDefaultAuthenticationIdentity"
      )(
        function*(parameters: FindDefaultAuthenticationIdentityParameters) {
          return yield* findDefaultAuthenticationIdentitySchema(parameters)
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding default authentication identity")
      )

      return {
        findAuthenticationIdentity,
        findDefaultAuthenticationIdentity
      }
    })
  }
) {}
