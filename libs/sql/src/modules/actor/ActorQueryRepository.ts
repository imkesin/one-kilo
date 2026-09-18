import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import { AccountId } from "@one-kilo/domain/ids/AccountId"
import { MachineClientId } from "@one-kilo/domain/ids/MachineClientId"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import { AccountType } from "@one-kilo/domain/values/AccountValues"
import type { ActorIdentity } from "@one-kilo/domain/values/ActorValues"
import { dieWithUnexpectedError, orDieWithUnexpectedError } from "@one-kilo/lib/errors/UnexpectedError"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as S from "effect/Schema"

type FindActorIdentityParameters = {
  readonly workosUserId: WorkOSIds.UserId
  readonly workosOrganizationId: WorkOSIds.OrganizationId
}

const ActorIdentityRow = S.Struct({
  accountId: AccountId,
  accountType: AccountType,
  machineClientId: S.NullOr(MachineClientId),
  personId: S.NullOr(PersonId),
  workspaceId: WorkspaceId
})

const toActorIdentity = (row: typeof ActorIdentityRow.Type): Effect.Effect<ActorIdentity> => {
  if (row.accountType === "Person" && row.personId) {
    return Effect.succeed({
      account: {
        id: row.accountId,
        type: "Person" as const,
        person: { id: row.personId }
      },
      workspace: { id: row.workspaceId }
    })
  }

  if (row.accountType === "MachineClient" && row.machineClientId) {
    return Effect.succeed({
      account: {
        id: row.accountId,
        type: "MachineClient" as const,
        machineClient: { id: row.machineClientId }
      },
      workspace: { id: row.workspaceId }
    })
  }

  return pipe(
    dieWithUnexpectedError("An actor identity row could not be converted to a domain value"),
    Effect.annotateLogs({ account: { id: row.accountId, type: row.accountType } })
  )
}

export class ActorQueryRepository extends Effect.Service<ActorQueryRepository>()(
  "@one-kilo/sql/ActorQueryRepository",
  {
    dependencies: [],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient

      const findActorIdentitySchema = SqlSchema.findOne({
        Request: S.Struct({
          workosUserId: WorkOSIds.UserId,
          workosOrganizationId: WorkOSIds.OrganizationId
        }),
        Result: ActorIdentityRow,
        execute: ({ workosUserId, workosOrganizationId }) =>
          sql`
            SELECT
              accounts.id AS account_id,
              accounts.type AS account_type,
              accounts.machine_client_id AS machine_client_id,
              accounts.person_id AS person_id,
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

      const findActorIdentity = Effect.fn("ActorQueryRepository.findActorIdentity")(
        function*(parameters: FindActorIdentityParameters) {
          const maybeRow = yield* findActorIdentitySchema(parameters)

          if (Option.isNone(maybeRow)) {
            return Option.none<ActorIdentity>()
          }

          return yield* Effect.map(
            toActorIdentity(maybeRow.value),
            Option.some
          )
        },
        orDieWithUnexpectedError("An unexpected error occurred while finding actor identity")
      )

      return { findActorIdentity }
    })
  }
) {}
