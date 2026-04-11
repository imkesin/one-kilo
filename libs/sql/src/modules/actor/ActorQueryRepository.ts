import * as WorkOSIds from "@effect/auth-workos/domain/Ids"
import * as SqlClient from "@effect/sql/SqlClient"
import * as SqlSchema from "@effect/sql/SqlSchema"
import { MachineClientId } from "@one-kilo/domain/ids/MachineClientId"
import { PersonId } from "@one-kilo/domain/ids/PersonId"
import { UserId } from "@one-kilo/domain/ids/UserId"
import { WorkspaceId } from "@one-kilo/domain/ids/WorkspaceId"
import type { ActorIdentity } from "@one-kilo/domain/values/ActorValues"
import { UserType } from "@one-kilo/domain/values/UserValues"
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
  userId: UserId,
  userType: UserType,
  machineClientId: S.NullOr(MachineClientId),
  personId: S.NullOr(PersonId),
  workspaceId: WorkspaceId
})

const toActorIdentity = (row: typeof ActorIdentityRow.Type): Effect.Effect<ActorIdentity> => {
  if (row.userType === "Person" && row.personId) {
    return Effect.succeed({
      user: { id: row.userId, type: "Person" as const, person: { id: row.personId } },
      workspace: { id: row.workspaceId }
    })
  }

  if (row.userType === "MachineClient" && row.machineClientId) {
    return Effect.succeed({
      user: { id: row.userId, type: "MachineClient" as const, machineClient: { id: row.machineClientId } },
      workspace: { id: row.workspaceId }
    })
  }

  return pipe(
    dieWithUnexpectedError("An actor identity row could not be converted to a domain value"),
    Effect.annotateLogs({ user: { id: row.userId, type: row.userType } })
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
              u.id AS user_id,
              u.type AS user_type,
              u.machine_client_id AS machine_client_id,
              u.person_id AS person_id,
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
