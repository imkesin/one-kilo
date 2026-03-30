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
              u.id AS user_id,
              ws.id AS workspace_id
            FROM users u
            JOIN workspace_memberships wsm ON wsm.user_id = u.id
            JOIN workspaces ws ON ws.id = wsm.workspace_id
            WHERE
              u.workos_user_id = ${workosUserId}
              AND ws.workos_organization_id = ${workosOrganizationId}
              AND u.archived_at IS NULL
              AND wsm.archived_at IS NULL
              AND ws.archived_at IS NULL
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
              u.id AS user_id,
              ws.id AS workspace_id,
              ws.workos_organization_id as workos_organization_id
            FROM users u
            JOIN workspace_memberships wsm ON wsm.user_id = u.id
            JOIN workspaces ws ON ws.id = wsm.workspace_id
            WHERE
              u.workos_user_id = ${workosUserId}
              AND ws.type = 'Personal'
              AND wsm.role = 'Owner'
              AND u.archived_at IS NULL
              AND wsm.archived_at IS NULL
              AND ws.archived_at IS NULL
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
